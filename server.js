const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const path = require('path');
const ejsLayouts = require('express-ejs-layouts');
const app = express();
const port = 3000;

// Middleware for parsing
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Setting up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Handlers & routes
const { routes, handlers } = require('./routeBuilder');

routes.forEach(route => {
    const handlerArray = route.handler.split('.');
    const handlerFunc = handlers[handlerArray[0]][handlerArray[1]];
        const attachEJSTemplateMiddleware = (req, res, next) => {
        req.ejsTemplate = route.ejsTemplate;
        next();
    };

    app[route.method](route.path, attachEJSTemplateMiddleware, handlerFunc);
});

// Root route to render add.ejs
app.get('/', (req, res) => {
    res.render('home', { title: "Home", message: 'Welcome to the Home page.' });
});

app.listen(port, () => {
    console.log(`Server started on: http://localhost:${port}`);
});
