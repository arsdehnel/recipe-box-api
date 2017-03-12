const logger = require( './logger' )( __filename );
const marshaler = require( 'dynamodb-marshaler' );
const AWS = require( 'aws-sdk' );

// const listsTable = {
// 	schema: {
// 		hash: [ 'id', ddb.schemaTypes().string ],
// 		range: [ 'time', ddb.schemaTypes().number ]		
// 	},
// 	rw: {
// 		read: 10, 
// 		write: 10
// 	}
// };

module.exports = {

	createTables( req, res, next ) {

		// ddb.createTable( 
		// 	'lists', 
		// 	listsTable.schema,
		// 	listsTable.rw, 
		// 	function( err, details ) {
		// 		logger.log( details );
		// 		logger.error( err );
		// 	} );

		res.json( {
			code: '00000',
			message: 'Table created successfully',
			tables: [
				'lists'
			]
		} );

		next();

	},

	getList: function( req, res, next ) {

		const dynamoDb = new AWS.DynamoDB( {
			accessKeyId: process.env.AWS_ACCESS_KEY, 
			secretAccessKey: process.env.AWS_SECRET_KEY, 
			region: 'us-west-2'
		} );

        const params = {
            ExpressionAttributeValues: {
                ':v1': {
                    S: 'groceries|arsdehnel'
                }
            },
            KeyConditionExpression: 'listKey = :v1',
            TableName: 'lists'
        };
		dynamoDb.query( params, function( err, data ) {
			if( err ) {
				res.status( 500 ).json( {
					code: '00002',
					message: 'An error occurred in the retrieval of your list',
					error: err,
					stack: err.stack
				} );
			} else {
				res.json( {
					items: data.Items.map( item => {
						return JSON.parse( marshaler.unmarshalItem( item ).item ); 
					} )
				} );
			}
		} );

	},

	putItem: function( req, res, next ) {

		const dynamoDb = new AWS.DynamoDB( {
			accessKeyId: process.env.AWS_ACCESS_KEY, 
			secretAccessKey: process.env.AWS_SECRET_KEY, 
			region: 'us-west-2'
		} );

		const item = { 
			listKey: `${ req.params.listCode }|arsdehnel`,
			itemId: req.params.itemId,
			item: JSON.stringify( req.body.item )
		};

		dynamoDb.putItem( {
			TableName: 'lists',
			ReturnConsumedCapacity: 'TOTAL',
			Item: marshaler.marshalItem( item )  // {username: {S: 'nackjicholson'}}
		}, function( err, data ) {
			if ( err ) {
				console.log( err, err.stack ); // an error occurred
				res.status( 500 ).json( {
					code: '00001',
					message: 'An error occurred during saving of your item',
					error: err,
					stack: err.stack
				} );
			} else {
				logger.debug( data );
				console.log( data ); // successful response
				res.json( {
					code: '00000',
					message: 'Item saved successfully',
					item: data
				} );

			}
		} );
		
	},

	deleteItem: function( req, res, next ) {

		const dynamoDb = new AWS.DynamoDB( {
			accessKeyId: process.env.AWS_ACCESS_KEY, 
			secretAccessKey: process.env.AWS_SECRET_KEY, 
			region: 'us-west-2'
		} );

		const item = { 
			listKey: `${ req.params.listCode }|arsdehnel`,
			itemId: req.params.itemId
		};

		dynamoDb.deleteItem( {
			TableName: 'lists',
			Key: marshaler.marshalItem( item )  // {username: {S: 'nackjicholson'}}
		}, function( err, data ) {
			if ( err ) {
				res.status( 500 ).json( {
					code: '00003',
					message: 'An error occurred during deletion of your item',
					error: err,
					stack: err.stack
				} );
			} else {
				logger.debug( data );
				res.json( {
					code: '00000',
					message: 'Item deleted successfully',
					item: data
				} );

			}
		} );		
	}

};