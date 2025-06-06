import * as React from "react";
import NavbarComponent from "../components/navbar";
import firebase from "gatsby-plugin-firebase";
import {Col, Container, Nav, Row, Spinner, Tab, Tabs} from "react-bootstrap";
import StockTable from "../components/stocktable";
import StockChart from "../components/stockchart";
import Tweets from "../components/tweets";
import News from "../components/news";
import SearchResults from "../components/SearchResults";
import Loading from "../components/loading";
import TweetChart from "../components/tweetchart";
import StockSummary from "../components/stocksummary";
import "../styles/styles.css";

// markup
class IndexPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            stocks: [],
            searchResults: null,
            searchStr: "",
            selectedRow: undefined,
            loading: false
        };
        this.onClickRow = this.onClickRow.bind(this);
        this.search = this.search.bind(this);
        this.pickStock = this.pickStock.bind(this);
        this.stopSearch = this.stopSearch.bind(this);
    }

    async getData() {
        const firestore = firebase.firestore();
        const stocksResults = await firestore.collection("stocks").get();

        let stocks = stocksResults.docs.map(stockDoc => ({
            ticker: stockDoc.id,
            ...stockDoc.data()
        }));

        stocks.forEach(stock => {
            stock.day_candles.map( obj => {
              obj.date = obj.day.toDate();
              return obj;
            });
        });

        const cryptoResults = await firestore.collection("crypto").get();

        let cryptos = cryptoResults.docs.map(doc => ({
            ticker: doc.id,
            ...doc.data()
        }));

        cryptos.forEach(crypto => {
            crypto.day_candles.map( obj => {
              obj.date = obj.day.toDate();
              return obj;
            });
        });

        return {stocks, cryptos};
    }

    async componentDidMount() {
        const {stocks, cryptos} = await this.getData();

        this.setState({stocks, cryptos});
    }

    async pickStock(stock){
        console.log(`Picked stock ${stock}`);


        let {stocks} = await this.getData();
        let selectedRow = stocks.filter(stockRow => stockRow.ticker === stock)[0];

        if(!selectedRow) {
            this.setState({loading: true});
            const req = await fetch(`https://us-central1-financial-analyzer.cloudfunctions.net/updateFinnhubData?stock=${stock}`);
            const req2 = await fetch(`https://us-central1-financial-analyzer.cloudfunctions.net/updateSentimentTweetData?stock=${stock}`);
            if(req.ok && req2.ok) {
                const newData = {stocks} = await this.getData();
                stocks = newData.stocks;

                selectedRow = stocks.filter(stockRow => stockRow.ticker === stock)[0];
            }else{
                this.setState({loading: false});
                throw new Error("Error when loading stock data!");
            }
        }

        this.setState({stocks, selectedRow, searchStr: "", searchResults: null, loading: false});
    }

    onClickRow(stock) {
        this.setState({selectedRow: stock, searchStr: "", searchResults: null});
    }

    async search(string){
        console.log(`Searching ${string}`);
        if(string.startsWith("$")){
            string = string.slice(1);
        }
        this.setState({searchStr: string, searchResults: null});

        const req = await fetch(`https://us-central1-financial-analyzer.cloudfunctions.net/searchPhrase?phrase=${string}`);
        const data = await req.json();

        this.setState({searchResults: data.result});
    }

    stopSearch(){
        this.setState({searchResults: null, searchStr: ""});
    }

    render() {
        return (
            <main>
                <title>Home Page</title>
                <NavbarComponent onSearch={this.search.bind(this)} goBack={this.stopSearch}/>
                {this.state.loading && <Loading/>}
                <Container>
                    <Row>
                        <Col md={2}>
                            <StockTable name="Stocks" onClickRow={this.onClickRow} stocks={this.state.stocks}/>
                        </Col>
                        <Col md={2}>
                            <StockTable name="Cryptos" onClickRow={this.onClickRow} stocks={this.state.cryptos}/>
                        </Col>
                        <Col>
                            {
                                this.state.searchStr ?
                                    <>
                                    <h1>Searching: {this.state.searchStr}</h1>
                                    {this.state.searchResults ? <SearchResults goBack={this.stopSearch} results={this.state.searchResults} pickStock={this.pickStock}/> :
                                        <Spinner animation="border" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </Spinner>
                                    }
                                    </>
                                    :
                            ((!this.state.selectedRow)
                                ? <h3>Please select a stock ticker.</h3>
                                : <>
                                    <StockSummary stock={this.state.selectedRow}/>

                                    <StockChart stock={this.state.selectedRow}/>

                                    <TweetChart stock={this.state.selectedRow}/>

                                    <Tabs fill variant="tabs" defaultActiveKey="tweets">
                                        <Tab eventKey="tweets" title="Recent Tweets">
                                            {this.state.selectedRow && <Tweets tweets={this.state.selectedRow.tweets}/>}
                                        </Tab>


                                        {this.state.selectedRow && this.state.selectedRow.mostPopularTweets &&
                                        <Tab eventKey="popular-tweets" title="Popular Tweets">
                                            <Tweets tweets={this.state.selectedRow.mostPopularTweets}/>
                                        </Tab>
                                        }

                                        <Tab eventKey="news" title="News">
                                            {this.state.selectedRow && <News news={this.state.selectedRow.news}/>}
                                        </Tab>
                                    </Tabs>
                                </>
                            )}

                        </Col>
                    </Row>
                </Container>
            </main>
        );
    }
};

export default IndexPage;