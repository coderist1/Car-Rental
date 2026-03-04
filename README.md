# Web Version - CarRental App

This directory contains the web version of the CarRental application, separated from the React Native source code for better organization.

## Folder Structure

```
web/
├── index.html          # Main landing/welcome page
├── pages/              # All HTML page files
│   ├── login.html
│   ├── register.html
│   ├── admin-login.html
│   ├── dashboard.html          # Owner dashboard
│   ├── renter-dashboard.html   # Renter dashboard
│   └── admin-dashboard.html    # Admin dashboard
├── styles/             # All CSS stylesheets
│   ├── auth.css                # Shared auth page styles
│   ├── dashboard.css           # Owner dashboard styles
│   ├── renter-dashboard.css    # Renter dashboard styles
│   └── admin-dashboard.css     # Admin dashboard styles
└── scripts/            # All JavaScript files
    ├── dashboard.js            # Owner dashboard functionality
    ├── renter-dashboard.js     # Renter dashboard functionality
    └── admin-dashboard.js      # Admin dashboard functionality
```

## Entry Point

Start with `index.html` in the web/ directory. This serves as the main landing page that provides navigation to:
- User Login
- User Registration
- Admin Portal

## Page Structure

### Authentication Pages
- **index.html** - Landing page with navigation buttons
- **pages/login.html** - User login (supports both owners and renters)
- **pages/register.html** - User registration with role selection
- **pages/admin-login.html** - Admin-only login portal

### Dashboard Pages
- **pages/dashboard.html** - Owner dashboard for managing vehicles
- **pages/renter-dashboard.html** - Renter dashboard for browsing and filtering vehicles
- **pages/admin-dashboard.html** - Admin dashboard for platform management

## Resource Links

All pages properly reference CSS and JavaScript files using relative paths:
- From `index.html`: `styles/` and scripts within pages
- From `pages/`: `../styles/` for CSS and `../scripts/` for JS

## Development Notes

- Each HTML page is self-contained and can navigate to other pages
- Styling is centralized in the `styles/` directory
- JavaScript logic is modular in the `scripts/` directory
- Demo credentials are provided in authentication pages:
  - **Owner**: owner@test.com / password
  - **Renter**: renter@test.com / password
  - **Admin**: admin@test.com / admin123

## Deployment

To deploy the web version:
1. Copy the entire `web/` folder to your web server
2. Configure your web server to serve `index.html` as the entry point
3. Ensure all relative paths are correctly resolved

## Notes

The React Native source code (`src/`) remains unchanged and is used for the mobile app compilation with Expo.
