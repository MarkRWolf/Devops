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
    stage('Checkout') { steps { checkout scm } }

    stage('Azure / ACR Login') {
      steps {
        withCredentials([
          usernamePassword(credentialsId: 'azure-sp', usernameVariable: 'AZ_CLIENT_ID', passwordVariable: 'AZ_CLIENT_SECRET'),
          string(credentialsId: 'azure-tenant', variable: 'AZ_TENANT')
        ]) {
          bat '''
            az login --service-principal -u %AZ_CLIENT_ID% -p %AZ_CLIENT_SECRET% --tenant %AZ_TENANT%
            for /f "delims=" %%A in ('az acr login --name saasportfolioreg --expose-token --output tsv --query accessToken') do set ACR_TOKEN=%%A
            docker login saasportfolioreg.azurecr.io -u 00000000-0000-0000-0000-000000000000 -p %ACR_TOKEN%
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
          docker cp testcontainer:/test-results.xml test-results/test-results.xml
          docker rm testcontainer
        '''
      }
      post { always { junit 'test-results/test-results.xml' } }
    }

    stage('Build Images') {
      steps {
        bat '''
          docker build -t %BACKEND_IMG% -f Devops/Dockerfile.jenkins --target runtime .
          docker build -t %FRONTEND_IMG% ^
            --build-arg NEXT_PUBLIC_SELF_URL=%NEXT_PUBLIC_SELF_URL% ^
            --build-arg DOTNET_API_BASE_URL=%DOTNET_API_BASE_URL% ^
            -f client/Dockerfile client
        '''
      }
    }

    stage('Push Images') {
      steps {
        bat '''
          set DOCKER_CONFIG=%WORKSPACE%\\.docker
          if not exist %DOCKER_CONFIG% mkdir %DOCKER_CONFIG%
          for /f "delims=" %%A in ('az acr login --name saasportfolioreg --expose-token --output tsv --query accessToken') do set ACR_TOKEN=%%A
          docker logout saasportfolioreg.azurecr.io >NUL 2>&1
          docker login saasportfolioreg.azurecr.io -u 00000000-0000-0000-0000-000000000000 -p %ACR_TOKEN%
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
