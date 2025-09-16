pipeline {
  agent any

  environment {
    ACR = 'saasportfolioreg.azurecr.io'
    FRONTEND_IMG = "${ACR}/frontend:staging"
    BACKEND_IMG = "${ACR}/backend:staging"
    NEXT_PUBLIC_SELF_URL = 'https://devoptics.mark-wolf.com'
    DOTNET_API_BASE_URL = 'http://backend:5205/API'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Login to ACR') {
      steps {
        withCredentials([
          usernamePassword(credentialsId: 'azure-sp', usernameVariable: 'AZ_CLIENT_ID', passwordVariable: 'AZ_CLIENT_SECRET'),
          string(credentialsId: 'azure-tenant', variable: 'AZ_TENANT')
        ]) {
          sh '''
            az login --service-principal -u "$AZ_CLIENT_ID" -p "$AZ_CLIENT_SECRET" --tenant "$AZ_TENANT"
            az acr login --name saasportfolioreg
          '''
        }
      }
    }

    stage('Run Tests') {
      steps {
        sh '''
          docker build -f Devops/Dockerfile.runtime -t backend-test --target report .
          docker create --name testcontainer backend-test
          mkdir -p test-results
          docker cp testcontainer:/test-results.trx test-results/
          docker rm testcontainer
        '''
      }
      post {
        always {
          junit 'test-results/test-results.trx'
        }
      }
    }

    stage('Build & Push Images') {
      steps {
        sh '''
          docker build -t $BACKEND_IMG -f Devops/Dockerfile.runtime .
          docker build -t $FRONTEND_IMG \
            --build-arg NEXT_PUBLIC_SELF_URL=$NEXT_PUBLIC_SELF_URL \
            --build-arg DOTNET_API_BASE_URL=$DOTNET_API_BASE_URL \
            -f Dockerfile .

          docker push $BACKEND_IMG
          docker push $FRONTEND_IMG
        '''
      }
    }

    stage('Deploy to AKS') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-aks', variable: 'KUBECONFIG')]) {
          sh 'kubectl apply -f k8s/'
        }
      }
    }
  }
}
