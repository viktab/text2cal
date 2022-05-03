import React, { Component } from "react";
import { NewStory } from "../modules/NewPostInput.js";

import { get } from "../../utilities";

class Feed extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stories: [],
    };
  }

  render() {
    return (
      <>
        <NewStory />
      </>
    );
  }
}

export default Feed;
