
// makes the drop-down nav menu work in IE6
// 13 jan 09 - 15:20

var currLi = null;
var currPane = null;
var currTitle = null;

function navOnMouseOut() {
	hideCurrentDropDown();
}

function navOnMouseOver(section) {
	hideCurrentDropDown();
	
	var liObj = window.document.getElementById(section);
	if (liObj!=null) {
		currLi = liObj;
		currLi.style.backgroundColor = "#ffffff";
		var divsList = currLi.getElementsByTagName("div");
		for (i=0; i<divsList.length; i++) {
			if (divsList[i].className=="navbar-pane") {
				if (currPane!=null) currPane.style.display = "none";
				currPane = divsList[i];
				currPane.style.display = "block";
			}
			if (divsList[i].className=="navbar-title") {
				var aList = divsList[i].getElementsByTagName("a");
				if (aList.length==1) {
					currTitle = aList[0];
					currTitle.style.color = "#606060";				
				}			
			}			
		}
	}
}

function hideCurrentDropDown() {
	if (currLi!=null) {
		currLi.style.backgroundColor = "transparent";
		currLi = null;
	}
	if (currPane!=null) {
		currPane.style.display = "none";
		currPane = null;
	}
	if (currTitle!=null) {
		currTitle.style.color = "#ffffff";
		currTitle = null;
	}
}
