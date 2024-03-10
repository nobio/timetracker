# Installation Kubernetes Dashboard (Minikube)

see `https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/`

Minikube herunterladen
```
# install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# install minikube
curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 && chmod +x minikube

sudo mv minikube /usr/local/bin

sudo minikube start --driver=docker --force
```

## Dashboard installieren
```
# Installation
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
# Zugriffstoken erzeugen
sudo kubectl -n kubernetes-dashboard create token admin-user
# start proxy (Terminal bleibt offen, Proxy muss laufen; ggf. in Background schicken)
sudo kubectl proxy
```

## Auf lokalem Rechner (z.B. Mac)
```
ssh -L 8001:127.0.0.1:8001 -N -f -l nobio ubuntu20
```

## Aufruf im Browser:
http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/


Aufruf des Dashboards: http://localhost:8001

# Installation k3s (k3d)
https://k3d.io/v5.4.9/#quick-start

## Installation kubectl
```
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl
```

## Installation k3d (enthält k3s)

```
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
sudo kubectl cluster-info
k3d cluster create nobio-cluster
kubectl get nodes
```

## Installation Dashboard
`kubectl create -f https://raw.githubusercontent.com/kubernetes/dashboard/${VERSION_KUBE_DASHBOARD}/aio/deploy/recommended.yaml`

Anlage Datei `dashboard.admin-user.yaml`

Inhalt:
```
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
```

Anlage Datei `dashboard.admin-user-role.yaml`

Inhalt:
```
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kubernetes-dashboard
```

### Deploy users
`sudo kubectl create -f dashboard.admin-user.yaml -f dashboard.admin-user-role.yaml`

### Bearer Token:
`sudo k3s kubectl -n kubernetes-dashboard create token admin-user`

### Proxy starten
`kubectl proxy`

### ssh Tunnel starten (lokaler Rechner)
`ssh -L 8001:127.0.0.1:8001 -N -f -l nobio ubuntu20`
