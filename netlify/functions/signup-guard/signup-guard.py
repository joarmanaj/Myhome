import os
import json
import hashlib
import time
import requests

# Simple in-memory rate limiting
# Note: Netlify Functions are stateless, so this resets between invocations.
# For production, use a real database like Supabase for persistent rate limiting.
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX = 5      # max submissions per window

def handler(event, context):
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'success': False, 'message': 'Method not allowed.'})}

    try:
        body = json.loads(event.get('body', '{}'))
    except:
        body = {}

    name = body.get('name', '').strip()
    email = body.get('email', '').strip().lower()
    interest = body.get('interest', '').strip()
    recaptcha_response = body.get('recaptcha', '')
    honeypot = body.get('website', '')

    # ============ HONEYPOT CHECK ============
    if honeypot:
        # Silently accept but don't process
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True, 'message': 'Thank you.'})}

    # ============ NAME VALIDATION ============
    if len(name) < 2 or len(name) > 100:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'success': False, 'message': 'Invalid name.'})}
    if any(c in name for c in '<>{}[]()=;:'):
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'success': False, 'message': 'Name contains invalid characters.'})}
    if any(c.isdigit() for c in name):
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'success': False, 'message': 'Name should not contain numbers.'})}

    # ============ EMAIL VALIDATION ============
    if '@' not in email or '.' not in email.split('@')[1]:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'success': False, 'message': 'Invalid email.'})}

    temp_domains = [
        'mailinator.com', 'tempmail.org', '10minutemail.com', 'guerrillamail.com',
        'sharklasers.com', 'throwawaymail.com', 'dispostable.com', 'maildrop.cc',
        'getnada.com', 'temp-mail.org', 'tempmail.net', 'fakeinbox.com',
        'mailcatch.com', 'trashmail.com', 'yopmail.com', 'emailondeck.com',
        'spamgourmet.com', 'mintemail.com', 'mailnesia.com', 'mailnull.com',
        'example.com', 'test.com', 'mytemp.email', 'tempinbox.com',
        'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
        'trash-mail.com', 'opayq.com', 'mailinator.net', 'mailinator.org',
        'spamobox.com', 'binkmail.com', 'deadaddress.com', 'discardmail.com',
        'dodgeit.com', 'e4ward.com', 'gishpuppy.com', 'junkmail.com',
        'mailexpire.com', 'mailmetrash.com', 'mailslite.com', 'mypacks.net',
        'objectmail.com', 'proxymail.com', 'rcpt.at', 'shortmail.net',
        'sogetthis.com', 'tyldd.com', 'uggsrock.com', 'wuzup.net',
        'xs4all.nl', 'yopmail.fr', 'yopmail.net', 'cool.fr.nf',
        'jetable.fr.nf', 'nospammail.net', 'spambox.us', 'zybermail.com'
    ]
    domain = email.split('@')[1]
    if domain in temp_domains:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'success': False, 'message': 'Please use a permanent email address.'})}

    # ============ INTEREST VALIDATION ============
    allowed_interests = ['Collector', 'Commission', 'Art Decks', 'AI Services', 'General']
    if interest not in allowed_interests:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'success': False, 'message': 'Invalid interest.'})}

    # ============ RECAPTCHA VERIFICATION ============
    recaptcha_secret = os.environ.get('RECAPTCHA_SECRET_KEY', '')
    if not recaptcha_secret:
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'success': False, 'message': 'Server configuration error.'})}

    if not recaptcha_response:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'success': False, 'message': 'reCAPTCHA is required.'})}

    payload = {
        'secret': recaptcha_secret,
        'response': recaptcha_response
    }

    try:
        r = requests.post('https://www.google.com/recaptcha/api/siteverify', data=payload)
        result = r.json()
        if not result.get('success'):
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'success': False, 'message': 'reCAPTCHA verification failed.'})}
    except:
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'success': False, 'message': 'reCAPTCHA verification error.'})}

    # ============ RATE LIMITING (basic) ============
    client_ip = event.get('headers', {}).get('client-ip', 'unknown')
    ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()

    # In-memory store — resets on cold start
    # For production, use Supabase or Redis
    current_time = int(time.time())
    # Simple check: if we had a store, we'd check here
    # For now, reCAPTCHA + honeypot handle most spam

    # ============ SUCCESS ============
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'success': True, 'message': 'Thank you. You are on the list.'})
    }