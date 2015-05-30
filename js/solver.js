Solver = function(token, questionArea){
  if(!token || !questionArea){
    var err = new Error("Not enough parameters");
    throw err;
    return;
  }

  var token = token;
  var questionArea = $(questionArea);
  var timer;
  var questionsAnswered = 0;

  var arrayRegex = /(\[(.*?)\])/gi;
  var coordRegex = /.*?(\d+).*?.*?,.*?(.*?),.*?(\d+).*?.*?,.*?(.*?),.*?(\d+).*?(\d+)/i;
  var numRegex = /([0-9])+/gi;

  var mathTools = {
    distance: function(coord1, coord2){
      return Math.sqrt((Math.pow(coord2[0] - coord1[0], 2) + Math.pow(coord2[1] - coord1[1], 2)));
    },
    isPrime: function(value){
      for(var i = 2; i < value; i++) {
        if(value % i === 0) {
          return false;
        }
      }
      return true;
    }
  };

  var suggestions = [
    {
      name: "Reverse Array",
      description: "Reverses the first detected array in the question",
      check: function(question){
        if(question.toLowerCase().indexOf("reverse") !== -1 && arrayRegex.test(question)){
          return true;
        }
        return false;
      },
      answer: function(question){
        return "[" + JSON.parse(question.match(arrayRegex)[0]).reverse().join(", ") + "]";
      }
    },
    {
      name: "Perimeter (rounded up) - Triangle",
      description: "Finds the perimeter of a triangle, rounded up",
      check: function(question){
        if(question.toLowerCase().indexOf("perimeter (rounded up)") !== -1 && question.toLowerCase().indexOf("triangle") !== -1){
          return true;
        }
        return false;
      },
      answer: function(question){
        console.log("Assuming coordinates are in format x1,y1, x2,y2, etc.");
        var coords = question.match(coordRegex);
        // extract the points
        var point1 = [parseInt(coords[1]), parseInt(coords[2])],
            point2 = [parseInt(coords[3]), parseInt(coords[4])],
            point3 = [parseInt(coords[5]), parseInt(coords[6])];
        console.log("Coordinates:", point1, point2, point3);
        // get the distances between them
        var dist1 = mathTools.distance(point1, point2),
            dist2 = mathTools.distance(point1, point3),
            dist3 = mathTools.distance(point2, point3);
        // add them together
        var perimeter = dist1 + dist2 + dist3;
        return Math.ceil(perimeter);
      }
    },
    {
      name: "nth prime number greater than x",
      description: "Finds the nth prime number that is greater than x",
      check: function(question){
        if(question.toLowerCase().indexOf("prime number that is greater than") !== -1){
          return true;
        }
        return false;
      },
      answer: function(question){
        var numbers = question.match(numRegex);
        var end = parseInt(numbers[0]);
        var min = parseInt(numbers[1]);

        var primes = [];
        var i = 0;

        while(primes.length < end){
          i++;
          if(mathTools.isPrime(min+i)){
            primes.push(min+i);
          }
        }

        console.log(primes[end-1]);
        return primes[end-1];
      }
    }
  ];

  var addSuggestion = function(suggestion, question, suggestionArea, answer, answerPreview){
    var suggestionContainer = $('<div id="suggestion"></div>');
    var btn = $('<button type="button" class="btn btn-lg btn-primary">' + suggestion.name + '</button>');
    btn.click(function(){
      answerQuestion(answer);
    });
    var preview = $('<p>Answer preview: ' + answerPreview + '</p>');
    var help = $('<p>' + suggestion.description + '</p>');
    suggestionContainer.append(btn, help, preview);
    suggestionArea.append(suggestionContainer);

    $.material.init();
  };

  answerQuestion = function(answer){
    console.log("sending", JSON.parse(answer));
    clearTimeout(timer);
    $.ajax({
      url: "https://www.io15.foo/api/challenge",
      type: "POST",
      data: {token: token, answer: answer},
      headers: {token: token},
      success: function(data){
        if(data.challenge){
          questionsAnswered++;
          $("#questions-answered").text(questionsAnswered);
          renderQuestion(data);
        }else{
          if(data.message){
            alert(data.message);
          }else if(data.prize){
            alert("Done! Redirecting to prize...");
            window.location = data.prize;
          }
        }
      }
    });
  };

  var renderQuestion = function(data){
    timer = setTimeout(function(){
      if(confirm("Time's up. Restart?")){
        getAndRenderQuestion();
      }else{
        $("#question-area").fadeOut(function(){
          $("#instruction-area").fadeIn();
          questionsAnswered = 0;
          $("#questions-answered").text(questionsAnswered);
        });
      }
    }, parseInt(data.timeout));

    var suggestionArea = questionArea.find("#suggestion-area");
    suggestionArea.text("");

    questionArea.find("#question-title").text(data.challenge);

    for(i in suggestions){
      var suggestion = suggestions[i];
      if(suggestion.check(data.challenge)){
        var answer = suggestion.answer(data.challenge);
        var answerPreview = answer;

        if(typeof(answer) === "object")
          answerPreview = JSON.stringify(answer);

        addSuggestion(suggestion, data.challenge, suggestionArea, answer, answerPreview);
      }
    }
  };

  var getAndRenderQuestion = function(){
    $.ajax({
      url: "https://www.io15.foo/api/challenge",
      type: "GET",
      headers: {token: token},
      success: function(data){
        renderQuestion(data);
      }
    });
  };

  this.getAndRenderQuestion = getAndRenderQuestion

  return this;
};

$(document).ready(function(){
  $("#btn-next").click(function(){
    try{
      solver = new Solver($("#token-input").val(), $("#question-area")[0]);
    }catch(e){
      alert(e);
      return;
    }
    $("#instruction-area").fadeOut(function(){
      $("#question-area").fadeIn();
      solver.getAndRenderQuestion();
    });
  });
});
