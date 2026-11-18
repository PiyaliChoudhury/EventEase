
import json
import boto3
import uuid
from datetime import datetime, timezone

# Connect to DynamoDB using the Lambda execution role
dynamodb = boto3.resource('dynamodb')

# DynamoDB tables
events_table = dynamodb.Table('EventEaseEvents')
registrations_table = dynamodb.Table('EventEaseRegistrations')


def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        'body': json.dumps(body, default=str)
    }


def lambda_handler(event, context):

    try:
        method = (
            event.get('requestContext', {})
            .get('http', {})
            .get('method', '')
        )

        path = event.get('rawPath', event.get('path', ''))

        # Handle CORS preflight
        if method == 'OPTIONS':
            return response(200, {'message': 'CORS enabled'})

        # GET: Fetch all events
        if method == 'GET' and path.endswith('/events'):

            result = events_table.scan()
            events = result.get('Items', [])

            while 'LastEvaluatedKey' in result:
                result = events_table.scan(
                    ExclusiveStartKey=result['LastEvaluatedKey']
                )
                events.extend(result.get('Items', []))

            events.sort(key=lambda x: x.get('date', ''))

            return response(200, {
                'success': True,
                'events': events
            })

        # POST: Register for an event
        elif method == 'POST' and path.endswith('/register'):

            body = event.get('body', '{}')

            if isinstance(body, str):
                body = json.loads(body)

            participant_name = body.get('participantName')
            email = body.get('email')
            phone = body.get('phone')
            event_id = body.get('eventId')

            if not all([participant_name, email, phone, event_id]):
                return response(400, {
                    'success': False,
                    'message': 'All fields are required'
                })

            event_result = events_table.get_item(
                Key={'eventId': event_id}
            )

            if 'Item' not in event_result:
                return response(404, {
                    'success': False,
                    'message': 'Event not found'
                })

            registration_id = 'REG-' + str(uuid.uuid4())[:8].upper()

            registration = {
                'registrationId': registration_id,
                'participantName': participant_name,
                'email': email,
                'phone': phone,
                'eventId': event_id,
                'registrationDate': datetime.now(
                    timezone.utc
                ).isoformat()
            }

            registrations_table.put_item(
                Item=registration
            )

            return response(201, {
                'success': True,
                'message': 'Registration successful!',
                'registration': registration
            })

        else:
            return response(404, {
                'success': False,
                'message': 'Invalid API route'
            })

    except Exception as e:
        print('Error:', str(e))

        return response(500, {
            'success': False,
            'message': 'Internal server error',
            'error': str(e)
        })
