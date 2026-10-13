import argparse
import concurrent.futures
import json
import math
import os
import statistics
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:33318')
parser.add_argument('--users', type=int, default=10)
parser.add_argument('--requests', type=int, default=20)
parser.add_argument('--output', default='artifacts/performance.json')
args = parser.parse_args()
base = args.url.rstrip('/')

def request(path, method='GET', body=None, token=None):
    headers = {}
    data = None
    if body is not None:
        data = json.dumps(body).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(base + path, data=data, headers=headers, method=method)
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            content = response.read()
            return response.status, content, (time.perf_counter() - started) * 1000
    except urllib.error.HTTPError as error:
        return error.code, error.read(), (time.perf_counter() - started) * 1000
    except (urllib.error.URLError, TimeoutError, OSError):
        return 0, b'', (time.perf_counter() - started) * 1000

def login(email, password):
    status, body, _ = request('/api/auth/login', 'POST', {'email': email, 'password': password})
    if status != 200:
        raise RuntimeError('No se pudo iniciar la sesión de prueba')
    return json.loads(body)['token']

email = os.environ.get('LOAD_ADMIN_EMAIL', 'admin@biblioteca.com')
password = os.environ.get('LOAD_ADMIN_PASSWORD')
if not password:
    raise SystemExit('Definir LOAD_ADMIN_PASSWORD antes de ejecutar')
for _ in range(60):
    if request('/health')[0] == 200:
        break
    time.sleep(1)
else:
    raise SystemExit('La aplicación no está disponible después de 60 segundos')
admin = login(email, password)
student_email = 'carga-' + str(uuid.uuid4()) + '@example.com'
student_password = str(uuid.uuid4())
status, _, _ = request('/api/auth/register/alumno', 'POST', {
    'nombre': 'Alumno', 'apellido': 'Carga', 'email': student_email,
    'password': student_password, 'nivel': 'SECUNDARIA', 'grado': 3, 'seccion': 'A'
})
if status != 201:
    raise SystemExit('No se pudo preparar el alumno de prueba')
student = login(student_email, student_password)
student_id = json.loads(request('/api/usuarios/perfil', token=student)[1])['id']
book_ids = []

def phase(name, path, token, users, per_user, p95_limit):
    for _ in range(3):
        if request(path, token=token)[0] != 200:
            raise RuntimeError('No se pudo preparar el escenario ' + name)
    def worker(_):
        return [request(path, token=token) for _ in range(per_user)]
    started = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=users) as pool:
        results = [item for batch in pool.map(worker, range(users)) for item in batch]
    elapsed = time.perf_counter() - started
    samples = sorted(item[2] for item in results)
    percentile = lambda p: samples[min(len(samples) - 1, math.ceil(len(samples) * p) - 1)]
    errors = sum(item[0] != 200 for item in results)
    p95 = percentile(.95)
    return {
        'scenario': name, 'path': path, 'concurrent_users': users,
        'requests': len(results), 'errors': errors, 'elapsed_seconds': round(elapsed, 3),
        'requests_per_second': round(len(results) / elapsed, 2),
        'mean_ms': round(statistics.mean(samples), 2), 'p50_ms': round(percentile(.5), 2),
        'p95_ms': round(p95, 2), 'p99_ms': round(percentile(.99), 2),
        'maximum_ms': round(max(samples), 2), 'p95_limit_ms': p95_limit,
        'passed': errors == 0 and p95 <= p95_limit
    }

try:
    for i in range(40):
        status, body, _ = request('/api/libros', 'POST', {
            'nombre': 'Libro de carga ' + str(i), 'categoria': 'Novela',
            'codigoLibro': 'LOAD-' + str(uuid.uuid4()).upper(), 'stockTotal': 3, 'stockDisponible': 3
        }, admin)
        if status not in (200, 201):
            raise RuntimeError('No se pudo preparar el catálogo de prueba')
        book_ids.append(json.loads(body)['id'])
    phases = [
        phase('catalogo', '/api/libros', student, args.users, args.requests, 2000),
        phase('perfil', '/api/usuarios/perfil', student, args.users, args.requests, 2000),
        phase('dashboard', '/api/admin/dashboard', admin, args.users, args.requests, 2000),
        phase('exportacion_pdf', '/api/admin/reportes/top-libros/export/pdf', admin, 2, 5, 5000)
    ]
    result = {
        'created_at_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'environment': 'Medición local; no estima el rendimiento ni costo de Railway',
        'catalog_seed_books': len(book_ids), 'phases': phases,
        'passed': all(p['passed'] for p in phases)
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))
finally:
    for book_id in book_ids:
        request('/api/libros/' + str(book_id), 'DELETE', token=admin)
    request('/api/admin/usuarios/' + str(student_id), 'DELETE', token=admin)
if not result['passed']:
    raise SystemExit(1)
