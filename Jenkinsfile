pipeline {
  agent any

  environment {
    ACR = 'saasportfolioreg.azurecr.io'
    FRONTEND_IMG = 'saasportfolioreg.azurecr.io/frontend:staging'
    BACKEND_IMG = 'saasportfolioreg.azurecr.io/backend:staging'
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
          bat '''
            az login --service-principal -u %AZ_CLIENT_ID% -p %AZ_CLIENT_SECRET% --tenant %AZ_TENANT%
            az acr login --name saasportfolioreg
          '''
        }
      }
    }

    stage('Run Tests') {
      steps {
        bat '''
          docker build -f Devops/Dockerfile.jenkins -t backend-test --target report .
          docker create --name testcontainer backend-test
          mkdir test-results 2>NUL
          docker cp testcontainer:/test-results.trx test-results/test-results.trx
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
        bat '''
          docker build -t %BACKEND_IMG% -f Devops/Dockerfile.jenkins .
          docker build -t %FRONTEND_IMG% ^
            --build-arg NEXT_PUBLIC_SELF_URL=%NEXT_PUBLIC_SELF_URL% ^
            --build-arg DOTNET_API_BASE_URL=%DOTNET_API_BASE_URL% ^
            -f Dockerfile .

          docker push %BACKEND_IMG%
          docker push %FRONTEND_IMG%
        '''
      }
    }

    stage('Deploy to AKS') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-aks', variable: 'KUBECONFIG')]) {
          bat 'kubectl apply -f k8s/'
        }
      }
    }
  }
}
