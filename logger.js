const
    log4js         = require( 'log4js' ),
    path           = require( 'path' );

module.exports = function ( filename = '' ) {
    const pathParts = filename.split( path.sep );
    const moduleFromPath = ( pathParts.length === 0 ? '' : pathParts[ pathParts.length - 1 ] ).split( '.' )[ 0 ];
    const logger = log4js.getLogger( moduleFromPath );
    return logger;
};