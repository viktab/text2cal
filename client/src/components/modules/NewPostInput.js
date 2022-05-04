import React, { Component } from "react";

import "./NewPostInput.css";
import { post } from "../../utilities";

/**
 * New Post is a parent component for all input components
 *
 * Proptypes
 * @param {string} defaultText is the placeholder text
 * @param {string} storyId optional prop, used for comments
 * @param {({storyId, value}) => void} onSubmit: (function) triggered when this post is submitted, takes {storyId, value} as parameters
 */
class NewPostInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      value: "",
    };
  }

  // called whenever the user types in the new post input box
  handleChange = (event) => {
    this.setState({
      value: event.target.value,
    });
  };

  // called when the user hits "Submit" for a new post
  handleSubmit = (event) => {
    event.preventDefault();
    this.props.onSubmit && this.props.onSubmit(this.state.value);
    this.setState({
      value: "",
    });
  };

  render() {
    return (
      <div className="u-flexColumn">
        <textarea
          placeholder={this.props.defaultText}
          value={this.state.value}
          onChange={this.handleChange}
          className="NewPostInput-input"
        />
        <button
          type="submit"
          className="NewPostInput-button u-pointer"
          value="Submit"
          onClick={this.handleSubmit}
        >
          Generate Events
        </button>
      </div>
    );
  }
}

/**
 * New Story is a New Post component for comments
 *
 * Proptypes
 * @param {string} defaultText is the placeholder text
 */
class NewStory extends Component {

  constructor(props) {
    super(props);

    this.state = {
      eventName: "",
    };
  }

  handleChange = (event) => {
    this.setState({
      eventName: event.target.value,
    });
  };

  uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  createICS = (input) => {
    var ics = "BEGIN:VCALENDAR\n" + 
              "PRODID:-//Viktoriya Tabunshchyk//Text2Cal1.0//EN\n" + 
              "VERSION:2.0\n" +
              "CALSCALE:GREGORIAN\n" +
              "METHOD:PUBLISH\n";
    var lines = input.split("\n");
    var name = this.state.eventName;
    for (var i in lines) {
      ics += this.createEvent(lines[i], name);
    }
    return ics + "END:VCALENDAR";
  }

  createEvent = (input, name) => {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    var words = input.split(" ");
    var month = -1;
    var day = -1;
    var shour = -1;
    var smin = -1;
    var ehour = -1;
    var emin = -1;
    // get the date
    var remaining;
    if (!isNaN(words[0][0])) {
      // 04/18
      if (words[0].includes("/")) {
        var split = words[0].split("/");
        // weird format, return nothing
        if (split.length != 2) {
          return "";
        }
        // TODO: add a check to make sure it's mm/dd and not dd/mm
        month = parseInt(split[0].replace(/\D/g,''));
        day = parseInt(split[1].replace(/\D/g,''));
        remaining = words.slice(1, words.length);
      }
      // 18th
      else {
        // TODO handle case where they number the practices (ie 1. date time-time)
        day = parseInt(words[0].replace(/\D/g,''));
        remaining = words.slice(1, words.length);
      }
    } else {
      // find month name
      var monthIndex = -1;
      for (var i in months) {
        if (words[0].toLowerCase().includes(months[i])) {
          month = parseInt(i) + 1;
          monthIndex = 0;
        }
        if (words[1].toLowerCase().includes(months[i])) {
          month = parseInt(i) + 1;
          monthIndex = 1;
        }
      }
      // find day
      if (monthIndex == -1 || monthIndex == 0) {
        if (!isNaN(words[1][0])) {
          day = parseInt(words[1].replace(/\D/g,''));
          remaining = words.slice(2, words.length);
        }
      } 
      else {
        if (!isNaN(words[2][0])) {
          day = parseInt(words[2].replace(/\D/g,''));
          remaining = words.slice(3, words.length);
        }
      }
    }
    var foundTime = false;
    while (!foundTime) {
      if (!isNaN(remaining[0][0])) {
        foundTime = true;
        break;
      }
      remaining.shift();
    }
    // get time
    if (typeof remaining === 'undefined') {
      return "";
    }
    var split = remaining.join().split("-");
    if (split.length != 2) {
      return "";
    }
    var start = split[0];
    var end = split[1];
    [shour, smin] = this.parseTime(start);
    [ehour, emin] = this.parseTime(end);

    // convert to ics format
    const localDate = new Date();
    if (day == -1 || shour == -1 || smin == -1 || ehour == -1 || emin == -1) {
      return "";
    }
    if (month == -1) {
      month = parseInt(localDate.getMonth()) + 1;
    }
    if (input.toLowerCase().includes("filming")) {
      name += " filming";
    }
    var event = "BEGIN:VEVENT\n";
    event += "SUMMARY:" + name + "\n";
    event += "UID:" + this.uuid() + "\n";
    var timezoneStr = Intl.DateTimeFormat().resolvedOptions().timeZone;
    var year = new Date().getFullYear();
    if (parseInt(month) < 10) {
      month = "0" + month.toString();
    }
    if (parseInt(day) < 10) {
      day = "0" + day.toString();
    }
    if (parseInt(shour) < 10) {
      shour = "0" + shour.toString();
    }
    if (parseInt(ehour) < 10) {
      ehour = "0" + ehour.toString();
    }
    if (smin == 0) {
      smin = "00";
    }
    else if (parseInt(smin) < 10) {
      smin = "0" + smin.toString();
    }
    if (emin == 0) {
      emin = "00";
    }
    else if (parseInt(emin) < 10) {
      emin = "0" + emin.toString();
    }
    event += "DTSTART:" + year + month + day + "T" + shour + smin + "00\n";
    event += "DTEND:" + year + month + day + "T" + ehour + emin + "00\n";
    event += "END:VEVENT\n";
    return event;
  }

  parseTime = (input) => {
    var hour = -1;
    var min = -1;
    var addHour = 12;
    if (input.toLowerCase().includes("m")) {
      if (input.toLowerCase().includes("am")) {
        addHour = 0;
      }
    }
    if (input.includes(":")) {
      var split = input.split(":");
      if (split.length != 2) {
        return [-1, -1];
      }
      hour = parseInt(split[0].replace(/\D/g,''));
      min = parseInt(split[1].replace(/\D/g,''));
    }
    else {
      // TODO: handle weird case of 600 or 1100
      hour = parseInt(input.replace(/\D/g,''));
      min = 0;
    }
    if (hour == 12) {
      addHour = Math.abs(12-addHour);
    }
    return [hour + addHour, min];
  }

  addStory = (value) => {
    var ics = this.createICS(value);
    console.log(ics);
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(ics));
    element.setAttribute('download', "schedule.ics");

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  };

  render() {
    return (
      <div> 
        <input
          type="text"
          placeholder="Event name"
          value={this.state.value}
          onChange={this.handleChange}
          className="name-input"
        />
        <NewPostInput 
          defaultText="Enter your schedule here" 
          onSubmit={this.addStory} 
        />
      </div>
      );
  }
}

export { NewStory };
