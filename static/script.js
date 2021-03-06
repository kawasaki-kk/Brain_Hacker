var cards = {};
var totalcolumns = 0;
var columns = [];
var currentTheme = "bigcards";
var boardInitialized = false;
var keyTrap = null;
var nickname = {name : "default"}

//var socket = io.connect();
$(document).ready(function() {
    // chat box sets
    		$("#chat_div").chatbox({id : "chat_div",
                                  title : "chat",
                                  user : nickname,
                                  offset: 0,
                                  messageSent: function(id, user, msg){
                                       newMessage(msg, nickname.name);
                                       this.boxManager.addMsg(nickname.name, msg);}});
            $(".ui-chatbox").draggable().css({
							      left: 'auto',
							      right: 'auto',
							      top: 'auto',
							      bottom: 'auto'});

});

var socket = new WebSocket("ws://" + location.host + "/websocket");

//an action has happened, send it to the
//server
function sendAction(a, d) {
    //console.log('--> ' + a);

    var message = {
        action: a,
        data: d
    };

    socket.send(JSON.stringify(message));
}

socket.onopen = function() {
    //console.log('successful socket.io connect');

    //let the path be the room name
    var path = location.pathname;
    console.log("path"+path)
    //imediately join the room which will trigger the initializations
    sendAction('joinRoom', path);
};

socket.onclose = function() {
    blockUI("Server disconnected. Refresh page to try and reconnect...");
    //$('.blockOverlay').click($.unblockUI);
};

socket.onmessage = function(data) {
    getMessage(data);
};

function unblockUI() {
    $.unblockUI({fadeOut: 50});
}

function blockUI(message) {
    message = message || 'Waiting...';

    $.blockUI({
        message: message,

        css: {
            border: 'none',
            padding: '15px',
            backgroundColor: '#000',
            '-webkit-border-radius': '10px',
            '-moz-border-radius': '10px',
            opacity: 0.5,
            color: '#fff',
            fontSize: '20px'
        },

        fadeOut: 0,
        fadeIn: 10
    });
}

//respond to an action event
function getMessage(m) {
    //var message = m; //JSON.parse(m);
    var message = JSON.parse(m.data);
    var action = message.action;
    var data = message.data;

    //console.log('<-- ' + action);

    switch (action) {
        case 'chat':
            $("#chat_div").chatbox("option", "boxManager").addMsg(data.name, data['body']);
            console.log("chat get")
            break;

        case 'chatMessages':
            nickname.name = data.name;
            console.log("Chat Messages");

            for (var i = 0; i < data.cache.length; i++){
                //$("#chat_div").html($("#chat_div").html() + data.cache[i].body + '<br/>')
                $("#chat_div").chatbox("option", "boxManager").addMsg(data.cache[i].name, data.cache[i].body);
            }
            break;

        case 'roomAccept':
            //okay we're accepted, then request initialization
            //(this is a bit of unnessary back and forth but that's okay for now)
            sendAction('initializeMe', null);
            break;

        case 'roomDeny':
            //this doesn't happen yet
            break;

        case 'moveCard':
            moveCard($("#" + data.id), data.position);
            break;

        case 'initCards':
            initCards(data);
            break;

        case 'createCard':
            drawNewCard(data.id, data.text, data.x, data.y, data.rot, data.colour, null, data.vote_count);
            break;

        case 'deleteCard':
            $("#" + data.id).fadeOut(500,
                function() {
                    $(this).remove();
                }
            );
            break;

        case 'editCard':
            test =  $("#" + data.id).children('.content:first');
            test.text(data.value);
            break;

        case 'initColumns':
            initColumns(data);
            break;

        case 'updateColumns':
            initColumns(data);
            break;

        case 'changeTheme':
            changeThemeTo(data);
            break;

        case 'join-announce':
            displayUserJoined(data.sid, data.user_name);
            break;

        case 'leave-announce':
            displayUserLeft(data.sid);
            break;

        case 'initialUsers':
            displayInitialUsers(data);
            break;

        case 'nameChangeAnnounce':
            updateName(message.data.sid, message.data.user_name);
            break;

        case 'addSticker':
            addSticker(message.data.cardId, message.data.stickerId);
            break;

        case 'setBoardSize':
            resizeBoard(message.data);
            break;

        case 'voteUp':
            //$('#' + data.id + ' .vote-count').html(data['vote_count']);
            $('#' + data.id + ' .vote-count').html('+' + (parseInt($('#' + data.id + ' .vote-count').html()) + 1));
            break;

        case 'voteDown':
            //$('#' + data.id + ' .vote-count').html(data['vote_count']);
            $('#' + data.id + ' .vote-count').html('+' + (parseInt($('#' + data.id + ' .vote-count').html()) - 1));
            break;

        case 'advice':
        Lobibox.notify('info', {
               msg: data['sent'],
               title: 'ちょっと一言',
               img: "{{ static_url('images/avatar.png') }}",
               position: 'bottom left',
               delay: 5000,
               sound: false
               }
            );
            //Materialize.toast(data['sent'], 4000);
            break;

        case 'countUser':
        	$(".count-user").text('現在の参加人数は'+data+'人です');
            break;

        case 'getMember':
            $('#member_div').html("参加者： "+data);
            break;

        default:
            //unknown message
            alert('unknown action: ' + JSON.stringify(message));
            break;
    }

}

$(document).bind('keyup', function(event) {
    keyTrap = event.which;
});

function drawNewCard(id, text, x, y, rot, colour, sticker, vote_count, animationspeed) {



    var h = '<div id="' + id + '" class="card ' + colour +
        ' draggable" style="transform:rotate(' + rot +
        'deg);\
	">\
	<img src="{{ static_url('images/icons/token/')}}Xion.png" class="card-icon delete-card-icon" />\
	<img class="card-image" src="{{static_url('images/')}}' + colour + '-card.png">\
	<div id="content:' + id +
        '" class="content stickertarget droppable">' +
        text + '</div><span class="filler"></span>\
    <img src="{{ static_url('images/icons/token/')}}vote-up.png" class="vote-icon vote-up" />\
    <div class="vote-count">' + vote_count + '</div>\
	</div>';


    var card = $(h);
    card.appendTo('#board');

    //@TODO
    //Draggable has a bug which prevents blur event
    //http://bugs.jqueryui.com/ticket/4261
    //So we have to blur all the cards and editable areas when
    //we click on a card
    //The following doesn't work so we will do the bug
    //fix recommended in the above bug report
    // card.click( function() {
    // 	$(this).focus();
    // } );

    card.draggable({
        snap: false,
        snapTolerance: 5,
        containment: 'body',
        scroll: false,
        stack: ".card",
        start: function(event, ui) {
            keyTrap = null;
        },
        drag: function(event, ui) {
            if (keyTrap == 27) {
                ui.helper.css(ui.originalPosition);
                return false;
            }
        },
		handle: "div.content"
    });

    //After a drag:
    card.bind("dragstop", function(event, ui) {
        if (keyTrap == 27) {
            keyTrap = null;
            return;
        }

        var data = {
            id: this.id,
            position: ui.position,
            oldposition: ui.originalPosition,
        };

        sendAction('moveCard', data);
    });

    card.children(".droppable").droppable({
        accept: '.sticker',
        drop: function(event, ui) {
            var stickerId = ui.draggable.attr("id");
            var cardId = $(this).parent().attr('id');

            addSticker(cardId, stickerId);

            var data = {
                cardId: cardId,
                stickerId: stickerId
            };
            sendAction('addSticker', data);

            //remove hover state to everything on the board to prevent
            //a jquery bug where it gets left around
            $('.card-hover-draggable').removeClass('card-hover-draggable');
        },
        hoverClass: 'card-hover-draggable'
    });

    var speed = Math.floor(Math.random() * 1000);
    if (typeof(animationspeed) != 'undefined') speed = animationspeed;

    var startPosition = $("#tool-box").position();

    card.css('top', startPosition.top - card.height() * 0.5);
    card.css('left', startPosition.left - card.width() * 0.5);

    card.animate({
        left: x + "px",
        top: y + "px"
    }, speed);
   var zindex;
    card.hover(
        function() {
            $(this).addClass('hover');
            $(this).children('.card-icon').fadeIn(10);
            zindex = $(this).css('z-index');
            $(this).css('z-index', 10000);

        },
        function() {
            $(this).removeClass('hover');
            $(this).children('.card-icon').fadeOut(150);
            $(this).css('z-index', zindex);
        }
    );

    card.children('.card-icon').hover(
        function() {
            $(this).addClass('card-icon-hover');
        },
        function() {
            $(this).removeClass('card-icon-hover');
        }
    );

    card.hover(
        function() {
            $(this).addClass('hover');
            $(this).children('.vote-icon').fadeIn(10);
        },
        function() {
            $(this).removeClass('hover');
            $(this).children('.vote-icon').fadeOut(150);
        }
    );

    card.children('.vote-icon').hover(
        function() {
            $(this).addClass('vote-icon-hover');
        },
        function() {
            $(this).removeClass('vote-icon-hover');
        }
    );

    card.hover(
        function() {
            $(this).addClass('hover');
            $(this).children('.vote-count').fadeIn(10);
        },
        function() {
            $(this).removeClass('hover');
            $(this).children('.vote-count').fadeOut(150);
        }
    );


    card.children('.delete-card-icon').click(
        function() {
            $("#" + id).remove();
            //notify server of delete
            sendAction('deleteCard', {
                'id': id
            });
        }
    );

    card.children('.vote-up').click(
        function() {
            //$("#" + id).remove();
            //notify server of delete
            $('#' + id + ' .vote-count').html('+' + (parseInt($('#' + id + ' .vote-count').html()) + 1));
            sendAction('voteUp', {
                'id': id
            });
        }
    );

    card.children('.content').editable(function(value, settings) {
        onCardChange(id, value);
        return ("");
        //return (value);
    }, {
        type: 'textarea',
        submit: 'OK',
        style: 'inherit',
        cssclass: 'card-edit-form',
        placeholder: 'Double Click to Edit.',
        onblur: 'submit',
        event: 'dblclick', //event: 'mouseover'
    });

    //add applicable sticker
    if (sticker !== null)
        addSticker(id, sticker);
}

// Chat get new message
function newMessage(msg, name) {
    var data = {body: msg, name: name}
    sendAction('chat', data);
}

function onCardChange(id, text) {
    sendAction('editCard', {
        id: id,
        value: text
    });
}

function moveCard(card, position) {
    card.animate({
        left: position.left + "px",
        top: position.top + "px"
    }, 500);
}

function addSticker(cardId, stickerId) {

    stickerContainer = $('#' + cardId + ' .filler');

    if (stickerId === "nosticker") {
        stickerContainer.html("");
        return;
    }


    //if (Array.isArray(stickerId)) {
    //    for (var i in stickerId) {
    //        stickerContainer.prepend('<img src="static/images/stickers/' + stickerId[i] +
    //            '.png">');
    //    }
    //} else {
    //    if (stickerContainer.html().indexOf(stickerId) < 0)
    //        stickerContainer.prepend('<img src="static/images/stickers/' + stickerId +
    //            '.png">');
    //}

}


//----------------------------------
// cards
//----------------------------------
function createCard(id, text, x, y, rot, colour, vote_count) {

    drawNewCard(id, text, x, y, rot, colour, null, vote_count);

    var action = "createCard";

    var data = {
        id: id,
        text: text,
        x: x,
        y: y,
        rot: rot,
        colour: colour,
        vote_count: vote_count
    };

    sendAction(action, data);

}

function randomCardColour() {
    var colours = ['yellow', 'green', 'blue', 'white'];

    var i = Math.floor(Math.random() * colours.length);

    return colours[i];
}


function initCards(cardArray) {
    //first delete any cards that exist
    $('.card').remove();

    cards = cardArray;

    for (var i in cardArray) {
        card = cardArray[i];

        drawNewCard(
            card.id,
            card.text,
            card.x,
            card.y,
            card.rot,
            card.colour,
            card.sticker,
            card.vote_count,
            0
        );
    }

    boardInitialized = true;
    unblockUI();
}


//----------------------------------
// cols
//----------------------------------

function drawNewColumn(columnName) {
    var cls = "col";
    if (totalcolumns === 0) {
        cls = "col first";
    }

    $('#icon-col').before('<td class="' + cls +
        '" width="10%" style="display:none"><h2 id="col-' + (totalcolumns + 1) +
        '" class="editable">' + columnName + '</h2></td>');

    $('.editable').editable(function(value, settings) {
        onColumnChange(this.id, value);
        return (value);
    }, {
        style: 'inherit',
        cssclass: 'card-edit-form',
        type: 'textarea',
        placeholder: 'New',
        onblur: 'submit',
        width: '',
        height: '',
        xindicator: '<img src="{{static_url('images/')}}ajax-loader.gif">',
        event: 'dblclick', //event: 'mouseover'
    });

    $('.col:last').fadeIn(1500);

    totalcolumns++;
}

function onColumnChange(id, text) {
    var names = Array();

    //console.log(id + " " + text );

    //Get the names of all the columns right from the DOM
    $('.col').each(function() {

        //get ID of current column we are traversing over
        var thisID = $(this).children("h2").attr('id');

        if (id == thisID) {
            names.push(text);
        } else {
            names.push($(this).text());
        }

    });

    updateColumns(names);
}

function displayRemoveColumn() {
    if (totalcolumns <= 0) return false;

    $('.col:last').fadeOut(150,
        function() {
            $(this).remove();
        }
    );

    totalcolumns--;
}

function createColumn(name) {
    if (totalcolumns >= 8) return false;

    drawNewColumn(name);
    columns.push(name);

    var action = "updateColumns";

    var data = columns;

    sendAction(action, data);
}

function deleteColumn() {
    if (totalcolumns <= 0) return false;

    displayRemoveColumn();
    columns.pop();

    var action = "updateColumns";

    var data = columns;

    sendAction(action, data);
}

function updateColumns(c) {
    columns = c;

    var action = "updateColumns";

    var data = columns;

    sendAction(action, data);
}

function deleteColumns(next) {
    //delete all existing columns:
    $('.col').fadeOut('slow', next());
}

function initColumns(columnArray) {
    totalcolumns = 0;
    columns = columnArray;

    $('.col').remove();

    for (var i in columnArray) {
        column = columnArray[i];

        drawNewColumn(
            column
        );
    }
}


function changeThemeTo(theme) {
    currentTheme = theme;
    //$("link[title=cardsize]").attr("href", "static/css/" + theme + ".css");
    var testTarget=document.getElementById('cardsizes');
    testTarget.href="{{static_url('css/')}}" + theme + ".css";

}


//////////////////////////////////////////////////////////
////////// NAMES STUFF ///////////////////////////////////
//////////////////////////////////////////////////////////



function setCookie(c_name, value, exdays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays === null) ? "" : "; expires=" +
        exdate.toUTCString());
    document.cookie = c_name + "=" + c_value;
}

function getCookie(c_name) {
    var i, x, y, ARRcookies = document.cookie.split(";");
    for (i = 0; i < ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g, "");
        if (x == c_name) {
            return unescape(y);
        }
    }
}


function setName(name) {
    sendAction('setUserName', name);
    console.log("Name:" + name)
    setCookie('scrumscrum-username', name, 365);
}

function displayInitialUsers(users) {
    for (var i in users) {
        //console.log(users);
        displayUserJoined(users[i].sid, users[i].user_name);
    }
}

function displayUserJoined(sid, user_name) {
    name = '';
    if (user_name)
        name = user_name;
    else
        name = sid.substring(0, 5);


    $('#names-ul').append('<li id="user-' + sid + '">' + name + '</li>');
}

function displayUserLeft(sid) {
    name = '';
    if (name)
        name = user_name;
    else
        name = sid;

    var id = '#user-' + sid.toString();

    $('#names-ul').children(id).fadeOut(1000, function() {
        $(this).remove();
    });
}


function updateName(sid, name) {
    var id = '#user-' + sid.toString();

    $('#names-ul').children(id).text(name);
}

//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////

function boardResizeHappened(event, ui) {
    var newsize = ui.size;

    sendAction('setBoardSize', newsize);
}

function resizeBoard(size) {
    $(".board-outline").animate({
        height: size.height,
        width: size.width
    });
}
//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////

function calcCardOffset() {
    var offsets = {};
    $(".card").each(function() {
        var card = $(this);
        $(".col").each(function(i) {
            var col = $(this);
            if (col.offset().left + col.outerWidth() > card.offset().left +
                card.outerWidth() || i === $(".col").size() - 1) {
                offsets[card.attr('id')] = {
                    col: col,
                    x: ((card.offset().left - col.offset().left) / col.outerWidth())
                };
                return false;
            }
        });
    });
    return offsets;
}


//moves cards with a resize of the Board
//doSync is false if you don't want to synchronize
//with all the other users who are in this room
function adjustCard(offsets, doSync) {
    $(".card").each(function() {
        var card = $(this);
        var offset = offsets[this.id];
        if (offset) {
            var data = {
                id: this.id,
                position: {
                    left: offset.col.position().left + (offset.x * offset.col
                        .outerWidth()),
                    top: parseInt(card.css('top').slice(0, -2))
                },
                oldposition: {
                    left: parseInt(card.css('left').slice(0, -2)),
                    top: parseInt(card.css('top').slice(0, -2))
                }
            }; //use .css() instead of .position() because css' rotate
            //console.log(data);
            if (!doSync) {
                card.css('left', data.position.left);
                card.css('top', data.position.top);
            } else {
                //note that in this case, data.oldposition isn't accurate since
                //many moves have happened since the last sync
                //but that's okay becuase oldPosition isn't used right now
                moveCard(card, data.position);
                sendAction('moveCard', data);
            }

        }
    });
}

//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////

$(function() {


	//disable image dragging
	//window.ondragstart = function() { return false; };


    if (boardInitialized === false)
        blockUI('<img src="{{static_url('images/')}}ajax-loader.gif" width=43 height=11/>');

    //setTimeout($.unblockUI, 2000);


    $("#create-card-white")
        .click(function() {
            var rotation = Math.random() * 10 - 5; //add a bit of random rotation (+/- 10deg)
            uniqueID = Math.round(Math.random() * 99999999); //is this big enough to assure uniqueness?
            //alert(uniqueID);
            createCard(
                'card' + uniqueID,
                '',
                58, $('div.board-outline').height(), // hack - not a great way to get the new card coordinates, but most consistant ATM
                rotation,
               'white',
                0);
        });
	$("#create-card-yellow")
        .click(function() {
            var rotation = Math.random() * 10 - 5; //add a bit of random rotation (+/- 10deg)
            uniqueID = Math.round(Math.random() * 99999999); //is this big enough to assure uniqueness?
            //alert(uniqueID);
            createCard(
                'card' + uniqueID,
                '',
                58, $('div.board-outline').height(), // hack - not a great way to get the new card coordinates, but most consistant ATM
                rotation,
               'yellow',
                0);
        });
     $("#create-card-blue")
        .click(function() {
            var rotation = Math.random() * 10 - 5; //add a bit of random rotation (+/- 10deg)
            uniqueID = Math.round(Math.random() * 99999999); //is this big enough to assure uniqueness?
            //alert(uniqueID);
            createCard(
                'card' + uniqueID,
                '',
                58, $('div.board-outline').height(), // hack - not a great way to get the new card coordinates, but most consistant ATM
                rotation,
               'blue',
                0);
        });
     $("#create-card-green")
        .click(function() {
            var rotation = Math.random() * 10 - 5; //add a bit of random rotation (+/- 10deg)
            uniqueID = Math.round(Math.random() * 99999999); //is this big enough to assure uniqueness?
            //alert(uniqueID);
            createCard(
                'card' + uniqueID,
                '',
                58, $('div.board-outline').height(), // hack - not a great way to get the new card coordinates, but most consistant ATM
                rotation,
               'green',
                0);
        });


    // Style changer
    $("#smallify").click(function() {
        if (currentTheme == "bigcards") {
            changeThemeTo('smallcards');
        } else if (currentTheme == "smallcards") {
            changeThemeTo('bigcards');
        }
        /*else if (currentTheme == "nocards")
		{
			currentTheme = "bigcards";
			//$("link[title=cardsize]").attr("href", "css/bigcards.css");
			var testTarget=document.getElementById('cardsizes');
            testTarget.href="{{static_url('css/bigcards.css')}}";

		}*/

        sendAction('changeTheme', currentTheme);


        return false;
    });


    $('#icon-col').hover(
        function() {
            $('.col-icon').fadeIn(10);
        },
        function() {
            $('.col-icon').fadeOut(150);
        }
    );

    $('#add-col').click(
        function() {
            createColumn('New');
            return false;
        }
    );

    $('#delete-col').click(
        function() {
            deleteColumn();
            return false;
        }
    );


    // $('#cog-button').click( function(){
    // 	$('#config-dropdown').fadeToggle();
    // } );

    // $('#config-dropdown').hover(
    // 	function(){ /*$('#config-dropdown').fadeIn()*/ },
    // 	function(){ $('#config-dropdown').fadeOut() }
    // );
    //

    var user_name = getCookie('scrumscrum-username');



    $("#yourname-input").focus(function() {
        if ($(this).val() == 'unknown') {
            $(this).val("");
        }

        $(this).addClass('focused');

    });

    $("#yourname-input").blur(function() {
        if ($(this).val() === "") {
            $(this).val('unknown');
        }
        $(this).removeClass('focused');

        setName($(this).val());
    });

    $("#yourname-input").val(user_name);
    $("#yourname-input").blur();

    $("#yourname-li").hide();

    $("#yourname-input").keypress(function(e) {
        code = (e.keyCode ? e.keyCode : e.which);
        if (code == 10 || code == 13) {
            $(this).blur();
        }
    });


    $(".sticker").draggable({
        revert: true,
        zIndex: 1000
    });


    $(".board-outline").resizable({
        ghost: false,
        minWidth: 400,
        minHeight: 400,
        maxWidth: 3200,
        maxHeight: 1800,
    });

    //A new scope for precalculating
    (function() {
        var offsets;

        $(".board-outline").bind("resizestart", function() {
            offsets = calcCardOffset();
        });
        $(".board-outline").bind("resize", function(event, ui) {
            adjustCard(offsets, false);
        });
        $(".board-outline").bind("resizestop", function(event, ui) {
            boardResizeHappened(event, ui);
            adjustCard(offsets, true);
        });
    })();

    $('#marker').draggable({
        axis: 'x',
        containment: 'parent',

    });

    $('#eraser').draggable({
        axis: 'x',
        containment: 'parent'
    });

    $('#tool-box').draggable({
    });

    $("#board-screen-shot").click(function() {
		console.log("aaaaaaaaaaaaaaaaaa");
		screenshot('.target_screen');
	});

});



function screenshot( selector) {
	console.log('fire');
    var element = $(selector)[0];
    html2canvas(element, { onrendered: function(canvas) {
        date = new Date(jQuery.now()).toLocaleString();
        if (canvas.msToBlob) { //for IE
                var blob = canvas.msToBlob();
                window.navigator.msSaveBlob(blob, "Brain_Hacker"+date+".png");
        }else{
        	var imgData = canvas.toDataURL();

	        var a = document.createElement('a');
	        a.href = imgData;
	        a.download = "Brain_Hacker"+date+".png";
	        document.body.appendChild(a);

	        a.click();
	        a.remove();

        }
    }});
}

function erase_screenshot() {
    //$('#screen_image')[0].src = "";
    //$('#download')[0].href = "#";
    //$('#download')[0].innerHTML = "";
}