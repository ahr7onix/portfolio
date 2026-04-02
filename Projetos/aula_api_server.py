import socket
import json

HOST = '127.0.0.1'
PORT = 8000

database = {
    'users': [
        {'id': 1, 'name': 'Alice', 'email': 'alice@example.com'},
        {'id': 2, 'name': 'Bob', 'email': 'bob@example.com'}
    ]
}


def handle_request(request_data):
    request_line = request_data.split('\n')[0].strip()
    method, path, http_version = request_line.split(' ' )

    headers = {}
    body = ''

    parts = request_data.split('\r\n\r\n', 1)
    if len(parts) > 1:
        header_part, body = parts
        header_lines = header_part.split('\r\n')[1:]
        for line in header_lines:
            if ': ' in line:
                key, value = line.split(': ', 1)
                headers[key.lower()] = value
    
    response_status = '200 OK'
    response_body = {}
    response_headers = {'Content-Type': 'application/json'}

    if path == '/users':
        if method == 'GET':
            response_body = {'users': database['users']}
        elif method == 'POST':
            try:
                new_user_data = json.loads(body)
                
                new_user_id = max([u['id'] for u in database['users']]) + 1 if database['users'] else 1

                new_user = {
                    'id': new_user_id,
                    **new_user_data
                }

                database['users'].append(new_user)

                response_status = '201 Created'

                response_body = {
                    'message': 'User created successfully', 
                    'user': new_user
                    }
            except json.JSONDecodeError:
                response_status = '400 Bad Request'
                response_body = {'error': 'Invalid JSON in request body'}
        else:
            response_status = '405 Method Not Allowed'
            response_headers['Allow'] = 'GET, POST'
    elif path.startswith('/users/'):
        try:
            user_id = int(path.split('/')[-1])

            user = next((u for u in database['users'] if u['id'] == user_id), None)

            if user:

                if method == 'GET':
                    response_body = {'user': user}
                elif method == 'PUT':
                    try:
                        updated_data = json.loads(body)
                        
                        user.update(updated_data) 

                        response_body = {
                            'message': 'User updated successfully', 'user': user
                            }
                    except json.JSONDecodeError:
                        response_status = '400 Bad Request'
                        response_body = {
                            'error': 'Invalid JSON in request body'
                            }


                elif method == 'PATCH':
                    try:
                        patch_data = json.loads(body)
                        for key, value in patch_data.items():
                            if key in user:
                                user[key] = value
                        response_body = {
                            'message': 'User updated successfully', 'user': user
                        }
                    except json.JSONDecodeError:
                        response_status = '400 Bad Request'
                        response_body = {
                            'error': 'Invalid JSON in request body'
                        }

                elif method == 'DELETE':
                    database['users'] =  [u for u in database['users'] if u['id'] != user_id]

                    response_body = {'message': 'User deleted successfully'}
                else:
                    response_status = '405 Method Not Allowed'
                    response_headers['Allow'] = 'GET, PUT, PATCH, DELETE'

            else:
                response_status = '404 Not Found'
                response_body = {'error': 'User not found'}

        except ValueError:
            response_status = '400 Bad Request'
            response_body = {'error': 'Invalid user ID'}
    else:
        response_status = '404 Not Found'
        response_body = {'error': 'Endpoint not found'}

    response_line = f'HTTP/1.1 {response_status}'
    
    response_headers_str = '\r\n'.join([f'{k}:{v}' for k, v in response_headers.items()])         
    
    response_content = json.dumps(response_body, indent=2)

    full_response = f'{response_line}\r\n{response_headers_str}\r\n\r\n{response_content}'

    return full_response.encode('utf-8')

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server_socket:
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind((HOST, PORT))
    server_socket.listen(5)
    print(f'Server running on http://{HOST}:{PORT}')

    while True:
        conn, addr = server_socket.accept()
        with conn:
            print(f'Connected by {addr}')
            request_data = conn.recv(4096).decode('utf-8')
            if not request_data:
                continue
            
            print(f'Received request:\n{request_data}')
            response = handle_request(request_data)
            conn.sendall(response)  
            print('Response sent\n')