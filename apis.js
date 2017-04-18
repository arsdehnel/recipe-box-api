const logger = require( './logger' )( __filename );
const fetch = require( 'node-fetch' );
const apiBase = 'https://kong-admin.pprd.rancher1.biw-services.com';
const sha256 = require( 'js-sha256' );
const stringUtils = require( './string-utils.js' );

// const apiBase = 'https://apipprd.biworldwide.com:8001';
// const redirectUri = 'http://www.biworldwide.com';
// const FormData = require( 'form-data' );

module.exports = {

	getApis: async ( req, res, next ) => {

		logger.info( 'getApis request receieved' );

		// const consumerId = req.params.consumerId;
		const username = req.query.username;
		// const clientApis = [];

		try {

			const apisResponse = await fetch( `${ apiBase }/apis` );
			const details = await apisResponse.json();

			if( apisResponse.status === 200 ) {

				// this feels super gross but async filters aren't a thing and this got the job done
				let consumerApis = await Promise.all( details.data.map( async api => {

					const aclResponse = await fetch( `${ apiBase }/apis/${ api.id }/plugins?name=acl` );
					const aclDetails = await aclResponse.json();

					if( aclDetails.data.length === 0 ) {
						return;
					} else if( aclDetails.data.length === 1 && aclDetails.data[ 0 ].config.whitelist[ 0 ] === `${ username }-acl-group` ) {
						return {
							id: api.id,
							requestPath: api.request_path,
							upstreamUrl: api.upstream_url
						};
					} else {
						return;
					}

				} ) );

				// i guess really _this_ is the gross part
				consumerApis = consumerApis.filter( api => typeof api === 'object' );

				res.json( {
					code: '00000',
					messages: [
						'apis retrieved successfully'
					],
					success: true,
					apis: consumerApis
				} );


			} else {

				res.json( {
					code: '00001',
					messages: [
						'apis failed to be retrieved',
						apisResponse.statusText
					],
					success: false,
					details
				} );

			}

		} catch( e ) {

			logger.error( 'error in getApis', e );

		}

	},

	saveApi: async ( req, res, next ) => {

		logger.info( 'saveApi request receieved' );

		const consumer = req.body.consumer;
		const requestPath = req.body.requestPath;
		const upstreamUrl = req.body.upstreamUrl;
		// const name = `/Recognition~PublicWall~${ consumer.username }`;

		try {

			const chunks = requestPath.split( '/' );
			const resource = stringUtils.capitalize( chunks[ 2 ] );
			const method = stringUtils.camelize( stringUtils.capitalize( chunks[ 3 ] ) );

			const createApiResponse = await fetch( `${ apiBase }/apis`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify( {
					name: `${ resource }~${ method }~${ consumer.username }`,
					request_path: requestPath,
					upstream_url: upstreamUrl,
					strip_request_path: true
				} )

			} );

			const details = await createApiResponse.json();

			if( createApiResponse.status === 201 ) {

				req.locals = details;
				req.locals.username = consumer.username;

				next();

			} else {

				res.json( {
					code: '00002',
					messages: [
						'error saving the api',
						createApiResponse.statusText
					],
					success: false,
					details
				} );

			}


		} catch( e ) {

			logger.error( 'error in saveApi', e );
			res.json( {
				code: '00001',
				messages: [
					'error saving the api',
					JSON.stringify( e )
				],
				success: false
			} );

		}				


	},

	addOAuth: async ( req, res, next ) => {

		logger.info( 'addOAuth request receieved', req.locals );

		try {

			logger.info( 'fetch url', `${ apiBase }/apis/${ req.locals.id }/plugins` );

			const addOAuthResponse = await fetch( `${ apiBase }/apis/${ req.locals.id }/plugins`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify( {
					name: 'oauth2',
					config: {
						enable_client_credentials: true,
						hide_credentials: true,
						accept_http_if_already_terminated: true
					}
				} )

			} );

			const details = await addOAuthResponse.json();

			req.locals.oauth = details;

			next();

		} catch( e ) {

			logger.error( 'error in saveApi', e );
			res.json( {
				code: '00003',
				messages: [
					'error saving the api',
					JSON.stringify( e )
				],
				success: false
			} );

		}				

	},

	addRequestTransformer: async ( req, res, next ) => {

		logger.info( 'addRequestTransformer request receieved', req.locals );

		try {

			logger.info( 'fetch url', `${ apiBase }/apis/${ req.locals.id }/plugins` );

			const addRequestTransformerResponse = await fetch( `${ apiBase }/apis/${ req.locals.id }/plugins`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify( {
					name: 'request-transformer',
					config: {
						add: {
							headers: [
								`API-Gateway-Auth: ${ sha256( req.locals.username ).toUpperCase() }`
							]
						}
					}
				} )

			} );

			const details = await addRequestTransformerResponse.json();

			req.locals.requestTransformer = details;

			next();

		} catch( e ) {

			logger.error( 'error in saveApi', e );
			res.json( {
				code: '00003',
				messages: [
					'error saving the api',
					JSON.stringify( e )
				],
				success: false
			} );

		}				

	},

	addACL: async ( req, res, next ) => {

		logger.info( 'addACL request receieved', req.locals );

		try {

			logger.info( 'fetch url', `${ apiBase }/apis/${ req.locals.id }/plugins` );

			const addACLResponse = await fetch( `${ apiBase }/apis/${ req.locals.id }/plugins`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify( {
					name: 'acl',
					config: {
						whitelist: `${ req.locals.username }-acl-group`
					}
				} )

			} );

			const details = await addACLResponse.json();

			req.locals.acl = details;

			next();

		} catch( e ) {

			logger.error( 'error in saveApi', e );
			res.json( {
				code: '00003',
				messages: [
					'error saving the api',
					JSON.stringify( e )
				],
				success: false
			} );

		}				

	},

	saveResponse: async ( req, res, next ) => {
		res.json( {
			code: '00000',
			messages: [
				'api saved successfully'
			],
			success: true,
			api: req.locals
		} );
	},

	deleteApi: async ( req, res, next ) => {

		logger.info( 'deleteApi request receieved', req.params.apiId );

		try {

			const deleteApiResponse = await fetch( `${ apiBase }/apis/${ req.params.apiId }`, {
				method: 'delete'
			} );

			logger.info( deleteApiResponse );

			if( deleteApiResponse.status === 204 ) {

				res.json( {
					code: '00000',
					messages: [
						'api removed successfully'
					],
					success: true
				} );

			} else {

				res.json( {
					code: '00006',
					messages: [
						'error deleting the api',
						deleteApiResponse.statusText
					],
					success: false
				} );

			}

		} catch( e ) {

			logger.error( 'error in deleteApi', e );
			res.json( {
				code: '00001',
				messages: [
					'error deleting the api',
					JSON.stringify( e )
				],
				success: false
			} );

		}				


	},


};