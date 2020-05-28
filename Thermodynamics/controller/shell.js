var initPageNo = 0;
var speed = 500;
var default_delay = 0;
var total_page = 0;
var currentPageNumber = 0;
var playerControllers = angular.module('PlayerControllers', []);

var uagent = navigator.userAgent.toLowerCase();
var platformAgent = navigator.platform.toLowerCase();

var audio_mute = false;

function getQuery(variable) {
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		if (pair[0] == variable) {
			return pair[1];
		}
	}
}

function GetIEVersion() {
	var sAgent = window.navigator.userAgent;
	var Idx = sAgent.indexOf("MSIE");

	// If IE, return version number.
	if (Idx > 0)
		return parseInt(sAgent.substring(Idx + 5, sAgent.indexOf(".", Idx)));

	// If IE 11 then look for Updated user agent string.
	else if (!!navigator.userAgent.match(/Trident\/7\./))
		return 11;

	else
		return 0; //It is not IE
}


var myApp = angular.module('myApp', [
	'ngRoute',
	'PlayerControllers',
	'textAngular'
]).filter('to_trusted', ['$sce', function ($sce) {
	return function (text) {
		return $sce.trustAsHtml(text);
	};
}]);

if (getQuery("admin") == "true") {
	myApp.directive("admin", function () {
		return {
			templateUrl: 'admin/admin.html'
		};
	});
} else {
	$().ready(function () {
		$("#admin").remove();
		$("#course").width("100vw");
	});
}

playerControllers.controller('PlayerController', ['$scope', '$http', '$routeParams', '$sce', '$timeout', function ($scope, $http, $routeParams, $sce, $timeout) {
	$http.get('content/' + language + '/' + file)
		.then(function (res) {
			$scope.content = res.data;
			$("body").fadeIn(1000);
			startAudio = res.data.course.audio;
		});

	$scope.nextEnable = false;
	$scope.alphabetArr = ["a", "b", "c", "d", "e", "f"];
	$scope.startBtn = function () {
		$("#splashScreen").fadeOut(500);
		$("#header").fadeIn(700);
		$scope.gotoPage(Number(startPage));
		$("#preloader").addClass("screen");
		//if(getWidthOfMobile() == true)
		//	hideNav();
	}

	$scope.next = function () {
		if ($scope.curr_page != total_page - 1 && $scope.nextEnable == true)
			$scope.gotoPage($scope.curr_page + 1);

	}

	$scope.prev = function () {
		if ($scope.curr_page != 0)
			$scope.gotoPage($scope.curr_page - 1);
	}

	$scope.exit_course = function () {
		window.close();
	}

	$scope.save_json = function () {
		$scope.msg = "Saving....";
		var method = 'POST';
		var url = 'savejson.php';
		$scope.codeStatus = "";

		$("#a-msg").show();
		var FormData = {
			'data': $scope.content,
			'file': 'content/' + language + '/' + file
		};
		$http({
			method: method,
			url: url,
			data: FormData,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		}).
		success(function (response) {
			console.log(response);
			$scope.msg = response;
			$("#a-msg").delay(3000).fadeOut(1000);
			//$scope.msg = "";
		}).
		error(function (response) {
			$scope.msg = response || "Request failed";
		});

	}


	$scope.gotoPage = function (index) {
		//console.log("page index = " + index);

		//$scope.nextEnable = isPageComplete(index);

		$("#next_tooltip").css("opacity", 0);
		$("#player").prop("muted", true);
		showPreloader();
		topic = $scope.content.menu.topic[index];
		$scope.curr_page = currentPageNumber = index;
		$scope.page = topic;
		$scope.total_page = total_page = $scope.content.menu.topic.length;
		$scope.pageURL = "views/common/blank.html";
		$scope.LoadURL = "views/" + topic.file;
		//$scope.pageURL = "views/" + topic.file;

		$scope.pageTitle = topic.title;
		$scope.text = topic.text;
		$scope.image = topic.image;
		$scope.currentTopic = topic;
		$("#page").scrollTop(0);
		$("#page").hide();
		if (topic.style != null)
			$("#pageStyle").attr("href", "views/" + topic.style);

		//if (screen.width <= 768) {
		//$('.menu').addClass("closeup");
		//$('#page').addClass("full");
		//}

		$('.menu').addClass("closeup");
		$('#page').addClass("full");
		$('.footer').addClass("full");
		$('#preloader').addClass("full");
	}

	$scope.audio_icon = "audio.png";
	$scope.audio_click = function () {
		audio_mute = !audio_mute;
		if (audio_mute == true) {
			$scope.audio_icon = "audio_mute.png";
			$("#player").prop("muted", true);
		} else {
			$scope.audio_icon = "audio.png";
			$("#player").prop("muted", false);
		}
	}

	$scope.getCourseCompleted = function () {
		return ($(".menu ul li .drawn").length >= (total_page - 1));
	}

	$scope.pageLoaded = function (url) {
		//console.log(url);
		if (url == "views/common/blank.html") {
			$scope.pageURL = $scope.LoadURL;
			return;
		}
		$("#page").fadeIn(250);
		pageLoaded();
	}

	$scope.bookmark_continue_click = function () {
		hideBookmark();
		//console.log("clicked cont");
		setVisitedPage(visited_page);
		$("#splashScreen").fadeOut(500);
		$("#header").fadeIn(700);
		$scope.gotoPage(Number(last_page));
		$("#preloader").addClass("screen");
	}

	$scope.bookmark_start_click = function () {
		hideBookmark();
		playAudio($scope.content.course.audio);
	}

	$scope.hideMessage = function () {
		$("#message").hide();
	}

	var timeout;

	function pageLoaded() {
		hidePreloader();
		playAudio(topic.audio);
		$("#page").fadeIn(500);
		//console.log("pageLoaded");
	}

	function showPreloader() {
		$('#preloader').fadeIn(500);
		$('#page').hide();
		clearTimeout(timeout);
		timeout = setTimeout(function () {
			if ($("#preloader").is(":visible") == true) {
				pageLoaded();
				console.log("from timeout");
			}
		}, 10000)
	}

}]);

function setVisitedPage(v) {
	var pages = v.split("_");
	last_page = Number(pages[pages.length - 2]);
	//setTimeout(function () {
	for (var i = 0; i < pages.length - 2; i++) {
		//console.log(pages[i]);
		$(".menu ul li").eq(pages[i]).find("#tick_mark").addClass("drawn");
	}
	setProgress($(".menu ul li .drawn").length);
	//}, 1000)
}

function isPageComplete(pageNo) {
	var pages = visited_page.split("_");
	//console.log(pageNo, visited_page, pages);
	for (var i = 0; i < pages.length - 1; i++) {
		if (pages[i] == pageNo.toString()) {
			//console.log(pageNo);
			return true;
		}
	}
	/*return false;*/
}


function hideBookmark() {
	$("#bookmark").hide();
}

function playAudio(filename) {
	//console.log(currentPageNumber + " == " + (total_page - 1));
	audio = $("#player")
	audio.trigger("pause");
	if (currentPageNumber == total_page - 1) {
		var completed_page = $(".menu ul li .drawn").length;
		//console.log(total_page + " <= " + completed_page);
		if (total_page - 1 <= completed_page) {
			audio.attr("src", filename);
		}
	} else {
		audio.attr("src", filename);
	}
	if (audio_mute == true) {
		$("#player").prop("muted", true);
		$(".home").scope().audio_icon = "audio_mute.png";
	} else {
		$("#player").prop("muted", false);
	}
};

function setCompleted() {
	var completed_page = $(".menu ul li .drawn").length;
	if (total_page == completed_page) {
		isCompleted = true;
		scormBroker.Score(100);
		//scormBroker.Complete('completed');
		scormBroker.Complete('passed');
	}
	visited_page = "";
	$(".menu ul li .drawn").each(function () {
		visited_page += ($(this).parent().index()) + "_";
	});
	setBookmark(currentPageNumber, visited_page);
	setProgress(completed_page);
}

function setProgress(comp) {
	var val = (comp / total_page * 150) - 2;
	$("#inner").width(val);
}

function hidePreloader() {
	$('#preloader').hide();
}

function animate() {
	var delay = 0;

	$(".animate").each(function () {

		var animFrom = $(this).data("animfrom");
		if (animFrom == undefined) {
			$(this).delay(delay)
				.css({
					marginTop: "+=50",
					opacity: 0,
				})
				.animate({
					marginTop: "-=50",
					opacity: 1,
				}, speed, function () {});
		} else if (animFrom == "left") {
			$(this).delay(delay).show('slide', {
				direction: 'left'
			}, speed);
			/*$(this).delay(delay)
				.css({
					marginRight: "+=50",
					opacity: 0,
				})
				.animate({
					marginRight: "-=50",
					opacity: 1,
				}, speed, function () {});*/
		} else if (animFrom == "right") {

			$(this).delay(delay)
				.css({
					/*marginLeft: "+=50",*/
					opacity: 0,
				})
				.animate({
					/*marginLeft: "-=50",*/
					opacity: 1,
				}, speed, function () {});
		}
		delay += speed;
	});
}

function imageLoaded(ths) {
	var width = $(ths).width();
	$(ths).css("width", "100%");
	$(ths).css("max-width", width);
}


function showMessage(title, desc) {
	$("#message .body .content").html(desc);
	$("#message").show();
}

function appear(elem, delay) {
	elem.delay(delay).show()
		.css({
			marginTop: "+=50",
			opacity: 0,
		})
		.animate({
			marginTop: "-=50",
			opacity: 1,
		}, speed, function () {});
}

/*function showNext(elem, delay) {
	elem.hide();
	elem.delay(delay).slideDown(1000, function () {
		
	});
}
*/
var interval;

function showNext(delay) {
	clearTimeout(interval);
	interval = setTimeout(function () {
		pageCompleted($(".sec").data("current"));
	}, delay);
}

function pageCompleted(index) {
	if ($(".menu ul li").eq(index).find("#tick_mark").hasClass("drawn") != true)
		$(".menu ul li").eq(index).find("#tick_mark").addClass("drawn");

	setCompleted();
	var scope = $("#ng-home").scope();
	scope.$apply(function () {
		scope.nextEnable = true;
		//if (scope.curr_page != scope.total_page - 1)
		//	$("#next_tooltip").css("opacity", 1);
	});
}


window.onload = function () {
	hidePreloader();
	showSplashScreen();
}

function showSplashScreen() {
	$("#splashScreen").fadeIn(500);
}

function showFullImage(src) {
	$("#fullscreen_img").show();
	$("#fullscreen_img img").attr("src", src);
}

function hideNav() {
	$("#header").hide();
	$("#header").addClass("hideNav");
	$("#page").addClass("hideNav");
	$("#preloader").css("marginTop", 0);
	hideNavInMobile = true;
}
//var navTimeout;
function showNav() {
	$("#header").delay(250).fadeIn(250);
	$("#header").removeClass("hideNav");
	$("#page").removeClass("hideNav");
	$("#preloader").css("marginTop", 60);
	/*clearTimeout(navTimeout);
	navTimeout = setTimeout(function(){
		if(hideNavInMobile == false)
		{
			hideNavInMobile = true;
			hideNav();
		}
	}, 5000);*/
}

function getWidthOfMobile() {
	return ($(window).width() <= 768);
}

var last_page = 0;
var visited_page = "";
var hideNavInMobile = false;
$().ready(function () {
	$("#message").hide();
	$("#menu_icon").click(function () {
		$('.menu').toggleClass("closeup");
		$('#page').toggleClass("full");
		$('.footer').toggleClass("full");
		$('#preloader').toggleClass("full");
	});
	$("#menu_icon").click();
	visited_page = getSuspendData();
	if (!(visited_page == "" || visited_page == "null" ||
			visited_page == null || visited_page == undefined)) {
		$("#bookmark").show();

	} else {
		playAudio(startAudio);
	}

	//image zoom
	$("#fullscreen_img .close_btn").click(function () {
		$("#fullscreen_img").hide();
	});


	var frameset = parent.document.getElementsByTagName('frameset');
	/*console.log("frameset = " + frameset);*/
	if (frameset.length > 0) {
		frameset[0].rows = '1,0'
		Console.log("changed frame size");
	}

});