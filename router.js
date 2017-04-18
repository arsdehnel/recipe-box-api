const express = require( 'express' );
const consumers = require( './consumers' );
const apis = require( './apis' );
const cors = require( 'cors' );
const bodyParser = require( 'body-parser' );
const jsonParser = bodyParser.json();

const router = express();

// router.set( 'view engine', 'html' );

// const server = restify.createServer();
router.use( cors() );
router.use( jsonParser );

// Consumers
router.get(    '/v1.0/consumers', consumers.getConsumers );
router.post(   '/v1.0/consumers', consumers.saveConsumer, consumers.createOAuthKeys, consumers.addACL, consumers.saveResponse );
router.delete( '/v1.0/consumers/:consumerId', consumers.deleteConsumer );

// APIs
router.get(    '/v1.0/consumers/:consumerId/apis', apis.getApis );
router.post(   '/v1.0/consumers/:consumerId/apis', apis.saveApi, apis.addOAuth, apis.addRequestTransformer, apis.addACL, apis.saveResponse );
router.delete( '/v1.0/consumers/:consumerId/apis/:apiId', apis.deleteApi );

// catch 404 and forward to error handler
router.use( function( req, res, next ) {
  const err = new Error( 'Not Found' );
  err.status = 404;
  next( err );
} );

// development error handler
// will print stacktrace
if ( router.get( 'env' ) === 'development' ) {
  router.use( function( err, req, res, next ) {
    res.status( err.status || 500 ).json( {
        message: err.message,
        error: err
    } );
  } );
}

// production error handler
// no stacktraces leaked to user
router.use( function( err, req, res, next ) {
  res.status( err.status || 500 ).json( {
      message: err.message,
      error: {}
  } );
} );

module.exports = router;

// server.listen( 5000, function() {
//   console.log( '%s listening at %s', server.name, server.url );
// } );