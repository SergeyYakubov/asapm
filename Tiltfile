config.define_string ( 'mode' , args=False , usage='mode: prod or dev (default)')
config.define_string ( 'targetHost' , args=False , usage='targetHost for nginx ingress')

cfg = config.parse()
mode=cfg.get('mode','dev')
targetHost=cfg.get('targetHost','localhost')

repo = local_git_repo('.')


k8s_yaml(helm('helm/asap-mds-frontend', set=['mdsFrontend.host='+targetHost]))
allow_k8s_contexts('guest-k8s')
watch_file('helm/asap-mds-frontend')

docker_build('yakser/asap-mds-frontend', '.',
  live_update=[
    # when package.json changes, we need to do a full build
    fall_back_on(['package.json', 'package-lock.json']),
    # Map the local source code into the container under /src
    sync('.', '/src'),
  ],
  target='' if mode == 'prod' else 'base' )