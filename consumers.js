const logger = require( './logger' )( __filename );
const fetch = require( 'node-fetch' );
const apiBase = 'https://kong-admin.pprd.rancher1.biw-services.com';
// const apiBase = 'https://apipprd.biworldwide.com:8001';
const redirectUri = 'http://www.biworldwide.com';
// const FormData = require( 'form-data' );

module.exports = {

	getConsumers: async ( req, res, next ) => {

		logger.info( 'getConsumers request receieved' );

		try {

			const response = await fetch( `${ apiBase }/consumers` );
			const consumers = await response.json();

			logger.info( 'consumer request completed', consumers );

			const consumersWithOAuth = await Promise.all( consumers.data.map( async client => {
				const oauthResponse = await fetch( `${ apiBase }/consumers/${ client.id }/oauth2` );
				const keys = await oauthResponse.json();
				const clientKeys = keys.data[ 0 ] || {};

				console.log( keys );

				return {
					id: client.id,
					username: client.username,
					createdAt: client.created_at,
					oauthId: clientKeys.id,
					oauthUsername: clientKeys.name,
					clientId: clientKeys.client_id,
					clientSecret: clientKeys.client_secret
				};
			} ) );

			res.json( {
				code: '00000',
				messages: [
					'clients retrieved successfully'
				],
				success: true,
				consumers: consumersWithOAuth
			} );

			// console.log( response.json() );

		} catch( e ) {

			logger.error( e );

			res.json( {
				code: '00001',
				messages: [
					'error retrieving client',
					JSON.stringify( e )
				],
				success: false,
				clients: []
			} );

		}

	},

	saveConsumer: async ( req, res, next ) => {

		logger.info( 'saveClient request received', req.body );

		try {
			
			const response = await fetch( `${ apiBase }/consumers`, {
				method: 'post',
				headers: {
					'Content-Type': 'application/json'
				},				
				body: JSON.stringify( {
					username: req.body.username
				} )
			} );

			const details = await response.json();

			if( response.status === 201 ) {

				req.locals = details;
				next();

			} else {

				res.json( {
					code: '00003',
					messages: [
						'client save failed',
						response.statusText,
						details
					],
					success: false
				} );

			}
			
		} catch( e ) {

			logger.error( e );

			res.json( {
				code: '00002',
				messages: [
					'error saving client',
					JSON.stringify( e )
				],
				success: false,
				clients: []
			} );

		}

	},

	createOAuthKeys: async ( req, res, next ) => {

		logger.info( 'createOAuthKeys request received' );

		const oauthResponse = await fetch( `${ apiBase }/consumers/${ req.locals.id }/oauth2`, {
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},				
			body: JSON.stringify( {
				name: req.locals.username,
				client_id: req.body.clientId,
				client_secret: req.body.clientSecret,
				redirect_uri: redirectUri
			} )
		} );

		const details = await oauthResponse.json();

		logger.info( 'oauthResponse', oauthResponse );

		if( oauthResponse.status === 201 ) {

			req.locals.oauth = details;
			next();

		} else {

			res.json( {
				code: '00004',
				messages: [
					'client key creation failed'
				],
				success: false,
				client: oauthResponse
			} );

		}

	},

	addACL: async ( req, res, next ) => {

		logger.info( 'addACL request received' );

		const aclResponse = await fetch( `${ apiBase }/consumers/${ req.locals.id }/acls`, {
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},				
			body: JSON.stringify( {
				group: `${ req.locals.username }-acl-group`
			} )
		} );

		const details = await aclResponse.json();

		logger.info( 'aclResponse', aclResponse );

		if( aclResponse.status === 201 ) {

			req.locals.acl = details;
			next();

		} else {

			res.json( {
				code: '00004',
				messages: [
					'acl group association failed'
				],
				success: false,
				aclResponse
			} );

		}

	},

	saveResponse: async ( req, res, next ) => {

		res.json( { 
			code: '00000',
			messages: [
				'consumer saved successfully'
			],
			success: true,
			consumer: {
				id: req.locals.id,
				username: req.locals.username,
				createdAt: req.locals.created_at,
				oauthId: req.locals.oauth.id,
				oauthUsername: req.locals.oauth.name,
				clientId: req.locals.oauth.client_id,
				clientSecret: req.locals.oauth.client_secret
			}
		} );

	},

	deleteConsumer: async ( req, res, next ) => {

		logger.info( 'deleteConsumer request received', req.params.consumerId );

		try {
			
			const response = await fetch( `${ apiBase }/consumers/${ req.params.consumerId }`, {
				method: 'delete'
			} );

			logger.debug( response );

			if( response.status === 204 ) {

				res.json( {
					code: '00000',
					messages: [
						'client removed successfully'
					],
					success: true
				} );

			} else {

				const message = await response.json();

				logger.error( message );

				res.json( {
					code: '00003',
					messages: [
						'client remove failed',
						response.statusText,
						message
					],
					success: false
				} );

			}
			
		} catch( e ) {

			logger.error( e );

			res.json( {
				code: '00002',
				messages: [
					'error saving client',
					JSON.stringify( e )
				],
				success: false,
				clients: []
			} );

		}

	}

};