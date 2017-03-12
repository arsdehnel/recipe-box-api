const express = require( 'express' );
const lists = require( './lists' );
const cors = require( 'cors' );
const bodyParser = require( 'body-parser' );
const jsonParser = bodyParser.json();
require( 'dotenv-safe' ).config();

const app = express();

app.set( 'view engine', 'html' );

// const server = restify.createServer();
app.use( cors() );
app.use( jsonParser );
app.get(    '/v1.0/lists/tables', lists.createTables );
app.get(    '/v1.0/lists/:listCode', lists.getList );
app.put(    '/v1.0/lists/:listCode/items/:itemId', lists.putItem );
app.delete( '/v1.0/lists/:listCode/items/:itemId', lists.deleteItem );

// catch 404 and forward to error handler
app.use( function( req, res, next ) {
  const err = new Error( 'Not Found' );
  err.status = 404;
  next( err );
} );

// development error handler
// will print stacktrace
if ( app.get( 'env' ) === 'development' ) {
  app.use( function( err, req, res, next ) {
    res.status( err.status || 500 ).json( {
        message: err.message,
        error: err
    } );
  } );
}

// production error handler
// no stacktraces leaked to user
app.use( function( err, req, res, next ) {
  res.status( err.status || 500 ).json( {
      message: err.message,
      error: {}
  } );
} );

module.exports = app;

// server.listen( 5000, function() {
//   console.log( '%s listening at %s', server.name, server.url );
// } );