repo = local_git_repo('.')

k8s_yaml(helm('helm/asap-mds-frontend'))
allow_k8s_contexts('guest-k8s')
watch_file('helm/asap-mds-frontend')

# Start with a base Dockerfile with none of our source code,
# and an entry point that starts a server.

docker_build('yakser/asap-mds-frontend', '.',
  live_update=[
    # when package.json changes, we need to do a full build
    fall_back_on(['package.json', 'package-lock.json']),
    # Map the local source code into the container under /src
    sync('.', '/src'),
  ])

k8s_resource('asap-mds-frontend', port_forwards=3000)
