{{- define "asapm.resourceName" -}}
{{- $name := toString .Values.resourceSuffix -}}
{{- printf "%s%s" .Chart.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

