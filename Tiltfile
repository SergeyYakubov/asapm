config.define_string ( 'mode' , args=False , usage='mode: prod or dev (default)')
config.define_string ( 'targetHost' , args=False , usage='targetHost for nginx ingress')

cfg = config.parse()
mode=cfg.get('mode','dev')
targetHost=cfg.get('targetHost','localhost')

os.putenv('TILT_MODE',mode)
os.putenv('TILT_TARGET_HOST',targetHost)

include('./api_server/Tiltfile')
include('./frontend/Tiltfile')

