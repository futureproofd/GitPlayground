var React = require('react');
var Popular = require('./Popular');

class App extends React.Component{
    render(){
        return(
            //JSX-syntax rather than element object
            <div className='container'>
                <Popular/>
            </div>
        )
    }
}

module.exports = App;