import * as React from "react"
import { Row, Col } from "react-bootstrap"
import { Tweet } from 'react-twitter-widgets'
import "../styles/masonry.css"
import Masonry from "react-masonry-css";

export default function Tweets(props) {
  return (
    <Row>
      <Col>
          <Masonry
              breakpointCols={{
                default: 2,
                1000: 1
              }}
              className="my-masonry-grid"
              columnClassName="my-masonry-grid_column">
              {props.tweets && props.tweets.map(tweet => tweet.mostPopularTweet ?
              <Tweet key={tweet.mostPopularTweet} tweetId={tweet.mostPopularTweet}/> :
                  (typeof tweet === "string" ? <Tweet key={tweet} tweetId={tweet}/> : undefined)
              )}
          </Masonry>
      </Col>
      <hr/>
    </Row>

  )

}