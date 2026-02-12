# 🦄 Wild Rydes - Serverless Web Application

Welcome to Wild Rydes! A modern, serverless web application that lets users request unicorn rides to their destination. This project demonstrates the power of AWS services including Lambda, API Gateway, DynamoDB, Cognito, and Amplify.

![Wild Rydes](https://img.shields.io/badge/Status-Active-success)
![AWS](https://img.shields.io/badge/AWS-Serverless-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🌟 Features

- **User Authentication** - Secure sign-up and sign-in with AWS Cognito
- **Interactive Map** - Click-to-select pickup locations using ArcGIS
- **Real-time Ride Requests** - Request unicorn rides via API Gateway and Lambda
- **Serverless Backend** - Fully serverless architecture with AWS services
- **Responsive Design** - Beautiful, modern UI that works on all devices
- **Persistent Storage** - Ride data stored in DynamoDB

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│             │     │              │     │             │
│  Amplify    │────▶│   Cognito    │────▶│ API Gateway │
│  (Hosting)  │     │ (Auth)       │     │             │
│             │     │              │     │             │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                 │
                                                 ▼
                                         ┌───────────────┐
                                         │               │
                                         │    Lambda     │
                                         │   Function    │
                                         │               │
                                         └───────┬───────┘
                                                 │
                                                 ▼
                                         ┌───────────────┐
                                         │               │
                                         │   DynamoDB    │
                                         │               │
                                         └───────────────┘
```

## 🚀 Quick Start

### Prerequisites

- AWS Account ([Sign up here](https://aws.amazon.com))
- GitHub Account
- Modern web browser

### Option 1: Use CDN Libraries (Recommended - Easiest!)

The HTML files are already configured to use CDN links for required libraries:
- jQuery 3.1.0
- Bootstrap 3.3.7
- AWS Cognito SDK

Just proceed with the AWS setup steps below!

### Option 2: Local Libraries

If you prefer to host libraries locally, see `SETUP_NOTES.md` for download instructions.

## 📋 Setup Instructions

### Module 1: Static Web Hosting with AWS Amplify

1. **Fork this Repository**
   ```bash
   # Fork this repo to your GitHub account
   ```

2. **Deploy with AWS Amplify**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "New app" → "Host web app"
   - Connect your GitHub account
   - Select your forked repository
   - Click "Save and deploy"

3. **Note your Amplify URL**
   ```
   Example: https://main.d111111abcdef8.amplifyapp.com
   ```

### Module 2: User Authentication with Cognito

1. **Create Cognito User Pool**
   - Go to [Amazon Cognito Console](https://console.aws.amazon.com/cognito/)
   - Click "Create user pool"
   - Choose "Email" as sign-in option
   - Keep default settings
   - Note your **User Pool ID** (e.g., `us-east-1_abcd1234`)

2. **Create App Client**
   - In your user pool, go to "App integration"
   - Create an app client (no client secret)
   - Note your **App Client ID**

3. **Update Configuration**
   - Edit `js/config.js`:
   ```javascript
   window._config = {
       cognito: {
           userPoolId: 'us-east-1_XXXXXXXXX',  // Your User Pool ID
           userPoolClientId: 'XXXXXXXXXXXXXXX', // Your App Client ID
           region: 'us-east-1'
       },
       api: {
           invokeUrl: '' // Leave empty for now
       }
   };
   ```

4. **Commit and Deploy**
   ```bash
   git add js/config.js
   git commit -m "Add Cognito configuration"
   git push
   ```
   Amplify will automatically redeploy!

### Module 3: Serverless Backend

1. **Create DynamoDB Table**
   - Go to [DynamoDB Console](https://console.aws.amazon.com/dynamodb/)
   - Create table named `Rides`
   - Partition key: `RideId` (String)
   - Use default settings

2. **Create IAM Role for Lambda**
   - Go to [IAM Console](https://console.aws.amazon.com/iam/)
   - Create role for Lambda
   - Attach `AWSLambdaBasicExecutionRole`
   - Add inline policy for DynamoDB:
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [{
           "Effect": "Allow",
           "Action": [
               "dynamodb:PutItem"
           ],
           "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/Rides"
       }]
   }
   ```

3. **Create Lambda Function**
   - Go to [Lambda Console](https://console.aws.amazon.com/lambda/)
   - Create function named `RequestUnicorn`
   - Runtime: Node.js 20.x
   - Use the IAM role you created
   - Copy code from `lambda/RequestUnicorn.js`:

   ```javascript
   const AWS = require('aws-sdk');
   const ddb = new AWS.DynamoDB.DocumentClient();
   const randomBytes = require('crypto').randomBytes;

   const fleet = [
       { Name: 'Shadowfax', Color: 'Silver', Gender: 'Male' },
       { Name: 'Bucephalus', Color: 'Golden', Gender: 'Male' },
       { Name: 'Rocinante', Color: 'Yellow', Gender: 'Female' },
   ];

   exports.handler = async (event, context) => {
       if (!event.requestContext.authorizer) {
           return errorResponse('Authorization not configured', context.awsRequestId);
       }

       const rideId = toUrlString(randomBytes(16));
       const username = event.requestContext.authorizer.claims['cognito:username'];
       const requestBody = JSON.parse(event.body);
       const pickupLocation = requestBody.PickupLocation;
       const unicorn = findUnicorn(pickupLocation);

       await recordRide(rideId, username, unicorn);

       return {
           statusCode: 201,
           body: JSON.stringify({
               RideId: rideId,
               Unicorn: unicorn,
               Eta: '30 seconds',
               Rider: username,
           }),
           headers: {
               'Access-Control-Allow-Origin': '*',
           },
       };
   };

   function findUnicorn(pickupLocation) {
       return fleet[Math.floor(Math.random() * fleet.length)];
   }

   async function recordRide(rideId, username, unicorn) {
       return ddb.put({
           TableName: 'Rides',
           Item: {
               RideId: rideId,
               User: username,
               Unicorn: unicorn,
               RequestTime: new Date().toISOString(),
           },
       }).promise();
   }

   function toUrlString(buffer) {
       return buffer.toString('base64')
           .replace(/\+/g, '-')
           .replace(/\//g, '_')
           .replace(/=/g, '');
   }

   function errorResponse(errorMessage, awsRequestId) {
       return {
           statusCode: 500,
           body: JSON.stringify({
               Error: errorMessage,
               Reference: awsRequestId,
           }),
           headers: {
               'Access-Control-Allow-Origin': '*',
           },
       };
   }
   ```

4. **Deploy Lambda Function**
   - Click "Deploy"
   - Test with sample event

### Module 4: API Gateway

1. **Create REST API**
   - Go to [API Gateway Console](https://console.aws.amazon.com/apigateway/)
   - Create REST API named `WildRydes`

2. **Create Cognito Authorizer**
   - In your API, go to "Authorizers"
   - Create new authorizer
   - Type: Cognito
   - Select your User Pool
   - Token Source: `Authorization`

3. **Create Resource and Method**
   - Create resource `/ride`
   - Create POST method
   - Integration type: Lambda Function
   - Select your `RequestUnicorn` function
   - Enable Lambda Proxy Integration
   - Use your Cognito authorizer

4. **Enable CORS**
   - Select `/ride` resource
   - Actions → Enable CORS
   - Deploy API to `prod` stage

5. **Update Configuration**
   - Copy your Invoke URL (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/prod`)
   - Edit `js/config.js`:
   ```javascript
   api: {
       invokeUrl: 'https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod'
   }
   ```

6. **Commit and Deploy**
   ```bash
   git add js/config.js
   git commit -m "Add API Gateway URL"
   git push
   ```

## 🧪 Testing

1. **Register a new user**
   - Go to your Amplify URL
   - Click "Sign In" → "Register"
   - Enter email and password
   - Check your email for verification code

2. **Verify your email**
   - Enter verification code
   - Sign in with your credentials

3. **Request a ride**
   - Click on the map to set pickup location
   - Click "Request Unicorn"
   - Watch your unicorn arrive!

4. **Verify in DynamoDB**
   - Check DynamoDB console
   - View items in `Rides` table

## 📁 Project Structure

```
wildrydes-site/
├── index.html              # Landing page
├── ride.html              # Main ride request page with map
├── register.html          # User registration
├── signin.html            # User sign in
├── verify.html            # Email verification
├── unicorns.html          # Unicorn fleet info
├── faq.html              # FAQ page
├── investors.html         # Investor information
├── apply.html            # Driver application
├── css/
│   ├── main.css          # Main stylesheet (enhanced)
│   └── font.css          # Font imports
├── js/
│   ├── config.js         # AWS configuration
│   ├── cognito-auth.js   # Authentication logic
│   ├── esri-map.js       # Map integration
│   └── ride.js           # Ride request logic
├── lambda/
│   └── RequestUnicorn.js # Lambda function code
├── README.md             # This file
└── SETUP_NOTES.md        # Detailed setup notes
```

## 🎨 New Features in This Version

### Enhanced UI/UX
- ✨ Modern gradient design
- 🎯 Improved navigation
- 📱 Fully responsive layout
- 🌈 Beautiful animations
- 💫 Better typography

### Improved Ride Page
- 🗺️ Clearer map interface
- 📍 Visual pickup instructions
- 📊 Real-time updates sidebar
- 🎨 Modern panel design

### Better Code Organization
- 📦 CDN-based libraries (easier setup)
- 🔧 Improved configuration
- 📝 Better documentation
- 🐛 Bug fixes

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Mapping**: ArcGIS API
- **Authentication**: AWS Cognito
- **Backend**: AWS Lambda (Node.js 20.x)
- **Database**: Amazon DynamoDB
- **API**: Amazon API Gateway
- **Hosting**: AWS Amplify
- **UI Libraries**: jQuery, Bootstrap

## 🔒 Security Best Practices

- ✅ HTTPS only (enforced by Amplify)
- ✅ Cognito user authentication
- ✅ API Gateway authorization
- ✅ IAM role permissions (least privilege)
- ✅ CORS properly configured
- ✅ No hardcoded credentials

## 💰 AWS Costs

Most services have generous free tiers:

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| Amplify | 1,000 build minutes | $0 |
| Cognito | 50,000 MAUs | $0 |
| Lambda | 1M requests | $0 |
| DynamoDB | 25 GB | $0 |
| API Gateway | 1M calls (first 12 months) | $0 |

**Total: $0 - $1/month for testing**

## 🗑️ Cleanup

To avoid charges, delete resources in this order:

1. Amplify app
2. API Gateway API
3. Lambda function
4. Cognito User Pool
5. DynamoDB table
6. IAM role

## 📚 Learning Resources

- [AWS Serverless Workshops](https://aws.amazon.com/serverless-workshops/)
- [AWS Amplify Docs](https://docs.amplify.aws/)
- [Amazon Cognito Docs](https://docs.aws.amazon.com/cognito/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Based on the AWS Wild Rydes Serverless Workshop
- ArcGIS for mapping functionality
- AWS for the amazing serverless platform

## 📞 Support

If you encounter issues:

1. Check `SETUP_NOTES.md` for detailed troubleshooting
2. Review AWS service logs (CloudWatch)
3. Verify configuration in `js/config.js`
4. Check browser console for errors

## 🎯 Next Steps

After completing this project, consider:

- Adding ride history
- Implementing ride cancellation
- Creating an admin dashboard
- Adding real-time notifications
- Building a mobile app with React Native

---

**Happy Coding! 🦄✨**

Made with ❤️ by the Wild Rydes Team











<div align="center">
🦄 Wild Rydes - AWS Serverless Ride-Hailing Application
Journey into the Future of Serverless Architecture
Show Image
Show Image
Show Image
Show Image

🌟 A production-ready serverless web application powered by 7 AWS services
Live Demo • Documentation • Report Bug • Request Feature

</div>
📖 Table of Contents

🎯 Overview
✨ Key Features
🏗️ Architecture
🔧 AWS Services Used
🚀 Getting Started
🛠️ Technologies
📊 Project Structure
🔐 Security
💰 Cost Optimization
🎓 Learning Outcomes
🤝 Contributing
📄 License


🎯 Overview
Wild Rydes is a comprehensive serverless web application that revolutionizes the ride-hailing experience by leveraging the power of AWS cloud services. This project demonstrates modern cloud architecture patterns, showcasing how to build scalable, cost-effective, and highly available applications without managing servers.
🌈 What Makes This Special?

100% Serverless - No servers to manage, automatic scaling
Real-world Application - Production-ready architecture
Secure Authentication - Enterprise-grade user management
Interactive UI - Beautiful, responsive design with real-time updates
Cost Efficient - Pay only for what you use
Cloud Native - Built specifically for cloud deployment


✨ Key Features
<table>
<tr>
<td width="50%">
🔐 User Management

Secure user registration & authentication
Email verification system
Password recovery
JWT token-based sessions
Multi-factor authentication ready

</td>
<td width="50%">
🗺️ Interactive Mapping

Real-time map interface
Click-to-select pickup locations
ArcGIS integration
Geocoding support
Visual ride tracking

</td>
</tr>
<tr>
<td width="50%">
🚀 Ride Management

Instant ride requests
Real-time unicorn dispatch
Ride history tracking
ETA calculations
Ride status updates

</td>
<td width="50%">
📱 Responsive Design

Mobile-first approach
Cross-browser compatibility
Modern UI/UX
Smooth animations
Accessibility features

</td>
</tr>
</table>

🏗️ Architecture
<div align="center">
````mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser] --> B[Amplify Hosting]
    end
subgraph "Authentication Layer"
    B --> C[Amazon Cognito]
    C --> D[User Pool]
end

subgraph "API Layer"
    B --> E[API Gateway]
    E --> F[Lambda Authorizer]
    C -.JWT Token.-> F
end

subgraph "Business Logic Layer"
    E --> G[Lambda Function]
    G --> H[RequestUnicorn Handler]
end

subgraph "Data Layer"
    H --> I[DynamoDB]
    I --> J[Rides Table]
end

subgraph "Deployment & CI/CD"
    K[GitHub Repository] --> B
end

style A fill:#e1f5ff
style B fill:#fff4e6
style C fill:#f3e5f5
style E fill:#e8f5e9
style G fill:#fff3e0
style I fill:#fce4ec
style K fill:#f1f8e9

</div>

### 🔄 Request Flow

1. **User Access** → User opens the application via AWS Amplify URL
2. **Authentication** → Cognito validates user credentials and issues JWT token
3. **Map Interaction** → User selects pickup location on interactive map
4. **API Request** → Frontend sends authenticated request to API Gateway
5. **Authorization** → API Gateway validates JWT token with Cognito
6. **Business Logic** → Lambda function processes the ride request
7. **Data Storage** → Ride details stored in DynamoDB
8. **Response** → Unicorn assignment returned to user in real-time

---

## 🔧 AWS Services Used

This project leverages **7 powerful AWS services** to create a fully serverless architecture:

### 1️⃣ **AWS Amplify** 
🌐 *Hosting & Continuous Deployment*

- Hosts the static website with global CDN
- Automatic HTTPS/SSL certificates
- CI/CD integration with GitHub
- Instant deployments on code push
- Custom domain support

**Why Amplify?**
- Zero server management
- Automatic scaling
- Built-in DDoS protection
- Lightning-fast global delivery

---

### 2️⃣ **Amazon Cognito**
🔐 *User Authentication & Authorization*

- Secure user registration and sign-in
- Email verification workflow
- Password policies and encryption
- JWT token generation
- User pool management
- Social identity provider support

**Features Implemented:**
- Email-based authentication
- Secure password storage (bcrypt)
- Token refresh mechanism
- Session management

---

### 3️⃣ **AWS Lambda**
⚡ *Serverless Compute*

- Runs code without provisioning servers
- Automatic scaling based on demand
- Pay-per-execution pricing
- Node.js 20.x runtime
- Integrated with other AWS services

**Lambda Functions:**
- `RequestUnicorn` - Main ride request handler
- Automatic unicorn assignment logic
- Error handling and logging

---

### 4️⃣ **Amazon API Gateway**
🚪 *RESTful API Management*

- Creates RESTful API endpoints
- Request/response transformation
- CORS configuration
- API versioning and staging
- Request throttling and rate limiting
- API key management

**Endpoints:**
- `POST /ride` - Submit ride request
- Integrated with Lambda authorizer
- Production-ready error handling

---

### 5️⃣ **Amazon DynamoDB**
💾 *NoSQL Database*

- Fully managed NoSQL database
- Single-digit millisecond latency
- Automatic scaling
- Built-in security
- Point-in-time recovery

**Table Structure:**
Table: Rides
├── RideId (Partition Key) - Unique identifier
├── User - Username from Cognito
├── Unicorn - Assigned unicorn details
│   ├── Name
│   ├── Color
│   └── Gender
├── UnicornName - Unicorn's name
├── RequestTime - ISO timestamp
└── PickupLocation - Lat/Long coordinates

---

### 6️⃣ **AWS IAM**
🔒 *Identity & Access Management*

- Secure service-to-service communication
- Principle of least privilege
- Fine-grained permissions
- Role-based access control

**Roles Created:**
- `LambdaExecutionRole` - For Lambda to write to CloudWatch & DynamoDB
- Policies for DynamoDB PutItem operation
- API Gateway execution roles

---

### 7️⃣ **Amazon CloudWatch**
📊 *Monitoring & Logging*

- Real-time application monitoring
- Lambda function logs
- API Gateway metrics
- Custom dashboards
- Alarms and notifications

**Monitoring:**
- Request count and latency
- Error rates and types
- Lambda execution duration
- DynamoDB read/write capacity

---

## 🚀 Getting Started

### Prerequisites

Before starting, ensure you have:

- ✅ AWS Account ([Create one here](https://aws.amazon.com/free/))
- ✅ GitHub Account
- ✅ Git installed locally
- ✅ Modern web browser (Chrome, Firefox, Safari, Edge)
- ✅ Basic knowledge of AWS Console

### 📋 Step-by-Step Setup

#### **Module 1: Static Web Hosting** 🌐

1. **Fork this Repository**
````bash
   # Go to: https://github.com/sidhi6276/aws-serverless-ride-app
   # Click the "Fork" button in the top-right corner
```

2. **Set Up AWS Amplify**
   - Navigate to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click **"New app"** → **"Host web app"**
   - Choose **GitHub** as the repository service
   - Authorize AWS Amplify to access your GitHub account
   - Select your forked repository
   - Branch: `main`
   - Click **"Save and deploy"**

3. **Wait for Deployment** (2-3 minutes)
   - Amplify will automatically build and deploy your app
   - Note your Amplify URL: `https://main.xxxxx.amplifyapp.com`

4. **Verify Deployment**
   - Open the Amplify URL in your browser
   - You should see the Wild Rydes homepage

✅ **Module 1 Complete!**

---

#### **Module 2: User Authentication** 🔐

1. **Create Cognito User Pool**
   - Go to [Amazon Cognito Console](https://console.aws.amazon.com/cognito/)
   - Click **"Create user pool"**
   - **Step 1 - Sign-in experience:**
     - Provider types: `Cognito user pool`
     - Sign-in options: ✅ `Email`
     - Click **Next**
   
   - **Step 2 - Security requirements:**
     - Password policy: `Cognito defaults`
     - Multi-factor authentication: `No MFA`
     - Click **Next**
   
   - **Step 3 - Sign-up experience:**
     - Self-service sign-up: ✅ `Enable`
     - Attribute verification: ✅ `Email`
     - Required attributes: `email`
     - Click **Next**
   
   - **Step 4 - Message delivery:**
     - Email provider: `Send email with Cognito`
     - Click **Next**
   
   - **Step 5 - Integrate your app:**
     - User pool name: `WildRydes`
     - App client name: `WildRydesWebApp`
     - Don't generate a client secret: ✅
     - Click **Next**
   
   - **Step 6 - Review and create:**
     - Review all settings
     - Click **"Create user pool"**

2. **Note Important IDs**
```
   User Pool ID: us-east-1_xxxxxxxxx
   App Client ID: xxxxxxxxxxxxxxxxxxxxxxxxxx

Update Configuration File

Clone your forked repository locally:



bash     git clone https://github.com/YOUR-USERNAME/aws-serverless-ride-app.git
     cd aws-serverless-ride-app

Edit js/config.js:

javascript     window._config = {
         cognito: {
             userPoolId: 'us-east-1_xxxxxxxxx',
             userPoolClientId: 'xxxxxxxxxxxxxxxxx',
             region: 'us-east-1'
         },
         api: {
             invokeUrl: ''
         }
     };

Save and commit changes:

bash     git add js/config.js
     git commit -m "Add Cognito configuration"
     git push origin main

Wait for Auto-Deployment (1-2 minutes)
Test Authentication

Go to your Amplify URL
Click "Giddy Up!"
Click "Register"
Enter email and password
Check your email for verification code
Verify and sign in



✅ Module 2 Complete!

Module 3: Serverless Backend ⚡

Create DynamoDB Table

Go to DynamoDB Console
Click "Create table"
Table name: Rides
Partition key: RideId (String)
Table settings: Default settings
Click "Create table"
Wait for table to become Active (30-60 seconds)


Create IAM Role for Lambda

Go to IAM Console
Click "Roles" → "Create role"
Trusted entity type: AWS service
Use case: Lambda
Click Next
Attach policy: AWSLambdaBasicExecutionRole
Click Next
Role name: WildRydesLambdaRole
Click "Create role"


Add DynamoDB Permissions

In the role you just created, click "Add permissions" → "Create inline policy"
Click JSON tab
Paste this policy (replace REGION and ACCOUNT_ID):



json     {
         "Version": "2012-10-17",
         "Statement": [
             {
                 "Effect": "Allow",
                 "Action": [
                     "dynamodb:PutItem"
                 ],
                 "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/Rides"
             }
         ]
     }

Click "Review policy"
Policy name: DynamoDBWriteAccess
Click "Create policy"


Create Lambda Function

Go to Lambda Console
Click "Create function"
Choose: Author from scratch
Function name: RequestUnicorn
Runtime: Node.js 20.x
Architecture: x86_64
Execution role: Use an existing role
Existing role: WildRydesLambdaRole
Click "Create function"


Add Lambda Function Code

In the Lambda console, scroll to Code source
Replace the code with the contents from lambda/RequestUnicorn.js
Click "Deploy"


Test Lambda Function

Click "Test" tab
Event name: TestRideRequest
Event JSON:



json     {
         "path": "/ride",
         "httpMethod": "POST",
         "headers": {
             "Accept": "*/*",
             "content-type": "application/json; charset=UTF-8"
         },
         "queryStringParameters": null,
         "pathParameters": null,
         "requestContext": {
             "authorizer": {
                 "claims": {
                     "cognito:username": "testuser"
                 }
             }
         },
         "body": "{\"PickupLocation\":{\"Latitude\":47.6174755835663,\"Longitude\":-122.28837066650185}}"
     }

Click "Save" then "Test"
Verify response shows a unicorn assignment

✅ Module 3 Complete!

Module 4: RESTful API 🚪

Create REST API

Go to API Gateway Console
Click "Create API"
Choose: REST API (not Private)
Click "Build"
Choose: New API
API name: WildRydes
Endpoint Type: Regional
Click "Create API"


Create Cognito Authorizer

In your API, click "Authorizers" in the left menu
Click "Create New Authorizer"
Name: WildRydes
Type: Cognito
Cognito User Pool: Select your WildRydes pool
Token Source: Authorization
Click "Create"


Create Resource

Click "Resources" in left menu
Select the root / resource
Click "Actions" → "Create Resource"
Resource Name: ride
Resource Path: ride
✅ Enable API Gateway CORS
Click "Create Resource"


Create POST Method

Select /ride resource
Click "Actions" → "Create Method"
Choose: POST
Click the checkmark ✓
Integration type: Lambda Function
✅ Use Lambda Proxy integration
Lambda Region: Your region (e.g., us-east-1)
Lambda Function: RequestUnicorn
Click "Save"
Click "OK" to grant permission


Configure Method Request

Click on "Method Request"
Authorization: Select WildRydes (your Cognito authorizer)
Click the checkmark ✓


Enable CORS

Select /ride resource
Click "Actions" → "Enable CORS"
Keep default settings
Click "Enable CORS and replace existing CORS headers"
Click "Yes, replace existing values"


Deploy API

Click "Actions" → "Deploy API"
Deployment stage: [New Stage]
Stage name: prod
Click "Deploy"


Note Invoke URL

Copy the Invoke URL (looks like: https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod)


Update Configuration

Edit js/config.js in your local repository:



javascript     window._config = {
         cognito: {
             userPoolId: 'us-east-1_xxxxxxxxx',
             userPoolClientId: 'xxxxxxxxxxxxxxxxx',
             region: 'us-east-1'
         },
         api: {
             invokeUrl: 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod'
         }
     };

Commit and push:

bash     git add js/config.js
     git commit -m "Add API Gateway invoke URL"
     git push origin main
```

10. **Wait for Deployment** (1-2 minutes)

✅ **Module 4 Complete! Your app is now fully functional! 🎉**

---

### 🧪 Testing Your Application

1. **Register a New User**
   - Go to your Amplify URL
   - Click **"Giddy Up!"**
   - Click **"Register"**
   - Enter email and create password (min 8 characters)
   - Check email for verification code
   - Enter code on verification page

2. **Sign In**
   - Return to app
   - Click **"Sign In"**
   - Enter your credentials

3. **Request a Ride**
   - You'll see an interactive map
   - Click anywhere on the map to set pickup location
   - Click **"Request Unicorn"**
   - Watch the notification show your assigned unicorn!

4. **Verify in DynamoDB**
   - Go to DynamoDB Console
   - Select `Rides` table
   - Click **"Explore table items"**
   - See your ride record with unicorn details

5. **Check CloudWatch Logs**
   - Go to CloudWatch Console
   - Click **"Log groups"**
   - Find `/aws/lambda/RequestUnicorn`
   - View execution logs

---

## 🛠️ Technologies

<table>
<tr>
<td align="center" width="25%">
<b>HTML5</b><br />
Semantic markup
</td>
<td align="center" width="25%">
<b>CSS3</b><br />
Modern styling
</td>
<td align="center" width="25%">
<b>JavaScript</b><br />
ES6+ features
</td>
<td align="center" width="25%">
<b>Node.js</b><br />
Runtime 20.x
</td>
</tr>
<tr>
<td align="center" width="25%">
<b>AWS</b><br />
Cloud platform
</td>
<td align="center" width="25%">
<b>Bootstrap</b><br />
UI framework
</td>
<td align="center" width="25%">
<b>jQuery</b><br />
DOM manipulation
</td>
<td align="center" width="25%">
<b>ArcGIS</b><br />
Mapping API
</td>
</tr>
</table>

---

## 📊 Project Structure
```
aws-serverless-ride-app/
│
├── 📄 index.html                 # Landing page
├── 📄 ride.html                  # Main ride request page
├── 📄 register.html              # User registration
├── 📄 signin.html                # User authentication
├── 📄 verify.html                # Email verification
├── 📄 unicorns.html              # Unicorn fleet information
├── 📄 faq.html                   # Frequently asked questions
├── 📄 apply.html                 # Driver application
├── 📄 investors.html             # Investor information
│
├── 📁 css/
│   ├── main.css                  # Primary stylesheet
│   ├── font.css                  # Font imports
│   └── message.css               # Toast notifications
│
├── 📁 js/
│   ├── config.js                 # AWS service configuration ⚙️
│   ├── cognito-auth.js           # Authentication logic
│   ├── esri-map.js               # Map integration
│   ├── ride.js                   # Ride request handling
│   └── vendor/                   # Third-party libraries
│       ├── jquery-3.1.0.min.js
│       ├── bootstrap.min.js
│       ├── aws-cognito-sdk.min.js
│       └── amazon-cognito-identity.min.js
│
├── 📁 lambda/
│   └── RequestUnicorn.js         # Lambda function code 🔥
│
├── 📁 docs/
│   ├── DEPLOYMENT.md             # Detailed deployment guide
│   ├── SETUP_NOTES.md            # Setup instructions
│   └── WHATS_NEW.md              # Version history
│
├── 📄 package.json               # Project metadata
├── 📄 README.md                  # This file
├── 📄 LICENSE                    # MIT License
└── 📄 .gitignore                 # Git ignore rules

🔐 Security
This application implements multiple layers of security:
✅ Authentication & Authorization

JWT token-based authentication via Cognito
Secure password storage with bcrypt
Email verification for new users
Session management with automatic token refresh

✅ API Security

CORS properly configured
API Gateway request validation
Lambda authorizer for endpoint protection
Rate limiting and throttling

✅ Data Protection

HTTPS enforcement (TLS 1.2+)
Encrypted data in transit and at rest
DynamoDB encryption enabled
No sensitive data in client-side code

✅ IAM Best Practices

Principle of least privilege
Separate roles for each service
No hardcoded credentials
Regular credential rotation

✅ Monitoring & Logging

CloudWatch logging enabled
API Gateway access logs
Lambda execution logs
DynamoDB CloudWatch metrics


💰 Cost Optimization
This project is designed to be extremely cost-effective, especially during development and testing:
📊 AWS Free Tier Coverage
ServiceFree TierThis Project UsageEstimated CostAWS Amplify1,000 build minutes/month~5 builds/month$0Amazon Cognito50,000 MAU<100 users$0AWS Lambda1M requests + 400,000 GB-sec<1,000 requests/month$0Amazon DynamoDB25 GB storage + 25 RCU/WCU<1 GB, minimal traffic$0Amazon API Gateway1M API calls (12 months)<1,000 calls/month$0Amazon CloudWatch5 GB logs + 10 metrics<1 GB logs$0Data Transfer1 GB out<100 MB/month$0
Total Monthly Cost: $0 - $1 (during free tier period)
💡 Cost-Saving Tips

Delete unused resources when not needed
Use on-demand DynamoDB pricing for development
Monitor CloudWatch usage to stay within free tier
Set up billing alerts to track spending
Clean up old Lambda versions


🎓 Learning Outcomes
After completing this project, you will have hands-on experience with:
☁️ Cloud Architecture

✅ Designing serverless applications
✅ Understanding microservices architecture
✅ Implementing event-driven systems
✅ Cloud-native application development

🛠️ AWS Services

✅ AWS Amplify for hosting and CI/CD
✅ Amazon Cognito for user management
✅ AWS Lambda for serverless compute
✅ Amazon API Gateway for API management
✅ Amazon DynamoDB for NoSQL databases
✅ AWS IAM for security and permissions
✅ Amazon CloudWatch for monitoring

💻 Development Skills

✅ RESTful API design and implementation
✅ JWT-based authentication
✅ Modern JavaScript (ES6+)
✅ Asynchronous programming (Promises, async/await)
✅ Git version control

🔒 Security Best Practices

✅ Implementing secure authentication
✅ Configuring CORS properly
✅ Managing IAM roles and policies
✅ Protecting sensitive data


🧹 Cleanup Instructions
To avoid any charges, delete resources in this order:

AWS Amplify App

Go to Amplify Console
Select your app → Actions → Delete app


API Gateway

Go to API Gateway Console
Select WildRydes API → Actions → Delete


Lambda Function

Go to Lambda Console
Select RequestUnicorn → Actions → Delete


Cognito User Pool

Go to Cognito Console
Select WildRydes → Delete user pool


DynamoDB Table

Go to DynamoDB Console
Select Rides table → Actions → Delete


IAM Role

Go to IAM Console
Select WildRydesLambdaRole → Delete role


CloudWatch Logs (Optional)

Go to CloudWatch Console
Delete log groups if desired




📚 Additional Resources
📖 Documentation

AWS Amplify Documentation
Amazon Cognito Developer Guide
AWS Lambda Documentation
Amazon API Gateway Documentation
Amazon DynamoDB Developer Guide

🔗 Helpful Links

AWS Free Tier
AWS Serverless Application Model (SAM)
ArcGIS API Documentation


🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.
How to Contribute

Fork the Project
Create your Feature Branch

bash   git checkout -b feature/AmazingFeature

Commit your Changes

bash   git commit -m 'Add some AmazingFeature'

Push to the Branch

bash   git push origin feature/AmazingFeature
```
5. **Open a Pull Request**

### 🐛 **Bug Reports**
If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
```
MIT License

Copyright (c) 2026 Wild Rydes

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

🎯 Roadmap
✨ Planned Features

 Ride History Dashboard - View past rides
 Real-time Ride Tracking - Track unicorn location
 Push Notifications - Ride status updates
 Payment Integration - Stripe/PayPal integration
 Rating System - Rate your ride experience
 Admin Dashboard - Manage rides and users
 Mobile App - React Native version
 Multi-language Support - i18n implementation
 Dark Mode - Theme toggle
 Advanced Analytics - User behavior insights


🙏 Acknowledgments
Special thanks to:

AWS for providing an amazing serverless platform
ArcGIS for the powerful mapping API
Bootstrap for the responsive UI framework
The open-source community for inspiration and support


💬 Support
Need Help?

📧 Email: support@wildrydes.com
📖 Documentation: Full docs

Troubleshooting
Common Issues:

Authentication not working

Verify Cognito User Pool ID and App Client ID in js/config.js
Check browser console for errors
Ensure email is verified


Ride request failing

Check API Gateway invoke URL in config
Verify Lambda function is deployed
Check CloudWatch logs for errors


Map not loading

Verify internet connection
Check browser console for ArcGIS errors
Clear browser cache




<div align="center">
🌟 Star This Repository
If this project helped you learn or build something awesome, please give it a ⭐!

🦄 Happy Riding with Wild Rydes! 🦄
Made with ❤️ by Sidhi Goel

Show Image
Show Image
Show Image
</div>
