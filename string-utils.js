module.exports = {
  camelize: function( string ) {
    // added this bit to handle the situation where the current string value is all uppercase
    if( string.toUpperCase() === string ) {
        string = string.toLowerCase();
    }
    return string.replace( /[_.-](\w|$)/g, function ( _, x ) {
        return x.toUpperCase();
    } );
  },
  capitalize: function( string ) {
    return string.charAt( 0 ).toUpperCase() + string.slice( 1 );
  }
};
