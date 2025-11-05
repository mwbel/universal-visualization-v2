
var currPreviewID = null;

function openPreview(id) {
	
	if (id==currPreviewID) return;
	
	if (currPreviewID!=null) {
		var item = document.getElementById(currPreviewID);
		item.style.fontWeight = "normal";	
	}
	
	currPreviewID = id;
	
	hidePreview();
	
	var preview = document.getElementById("previewContent");
	preview.style.left = String(findPosX(document.getElementById(currPreviewID))+180) + "px";
	
	var text = window.document.getElementById("previewText");
	text.innerHTML = resourceData[id].desc;
	//while (text.childNodes.length >= 1) text.removeChild(text.firstChild);       
	//text.appendChild(document.createTextNode(resourceData[id].desc));
	
	var title = window.document.getElementById("previewTitle");
	title.innerHTML = resourceData[id].title;
	//while (title.childNodes.length >= 1) title.removeChild(title.firstChild);       
	//title.appendChild(document.createTextNode(resourceData[id].title));
	
	var image = window.document.getElementById("previewImage");
	image.onload = onImageLoaded;
	image.src = resourceData[id].src;
	image.alt = resourceData[id].title;
}

function hidePreview() {
	var prevContainer = document.getElementById("previewContainer");
	prevContainer.style.display = "none";
	
	var previewShadow = document.getElementById("previewShadow");
	previewShadow.style.display = prevContainer.style.display;
	
	if (currPreviewID!=null) {
		var item = document.getElementById(currPreviewID);
		item.style.fontWeight = "normal";
	}
}

function closePreview() {
	hidePreview();
	currPreviewID = null;
}

function showPreview() {
	var prevContainer = document.getElementById("previewContainer");
	prevContainer.style.display = "block";
	
	var previewShadow = document.getElementById("previewShadow");
	previewShadow.style.display = prevContainer.style.display;

	if (currPreviewID!=null) {
		var item = document.getElementById(currPreviewID);
		item.style.fontWeight = "bold";
	}
}

function onImageLoaded() {
	showPreview();
	updatePreviewPosition();
}

function updatePreviewPosition() {
	
	if (currPreviewID==null) return;
	
	var iebody = (document.compatMode && document.compatMode!="BackCompat") ? document.documentElement : document.body;
	var scrollOffset = document.all ? iebody.scrollTop : pageYOffset;
	var viewport = getViewportDimensions();
	
	var previewContent = document.getElementById("previewContent");
	
	var contentHeight = getStyle(previewContent, "height");
	if (contentHeight=="auto") contentHeight = previewContent.offsetHeight;
	contentHeight = parseFloat(contentHeight);
	
	var previewHeight = Math.ceil(contentHeight);
	
	var line = document.getElementById(currPreviewID).parentNode;
	
	var lineHeight = getStyle(line, "height");
	if (lineHeight=="auto") lineHeight = line.offsetHeight;
	lineHeight = parseFloat(lineHeight);
	
	var yArrow = Math.round(findPosY(line) + lineHeight/4) - scrollOffset;
	
	var softMargin = 40;
	var hardMargin = 5;
	
	var cornerHeight = 17;
	var arrow1Height = 84;
	var arrow2Height = 67;
	var arrow3Height = 84;	
	var arrow1TopOffset = 61;
	var arrow2TopOffset = 59;
	var arrow2BottomOffset = 8;
	var arrow3TopOffset = 25;
	
	var d = previewHeight - (arrow1Height + 2*cornerHeight);
	var a = Math.floor(0.8*d);
	var b = d - a;
	
	var arrowMode = 1;
	
	var yBottom = yArrow + 2*cornerHeight + b;
	
	if (yBottom>(viewport.height-softMargin)) {
		b = viewport.height - softMargin - 2*cornerHeight - yArrow;
		if (b<0) b = 0;
		a = d - b;
	}
	
	yBottom = yArrow + 2*cornerHeight + b;
	
	if (yBottom>(viewport.height-softMargin)) {
		a = previewHeight - arrow2Height - cornerHeight;
		b = 0;
		arrowMode = 2;
	}
	
	yBottom = yArrow + arrow2BottomOffset;
	
	if (yBottom>(viewport.height-hardMargin)) {
		yArrow = viewport.height - hardMargin - arrow2BottomOffset;
		arrowMode = 2;
	}
		
	if (arrowMode==1) {
		
		var yTop = yArrow - a - cornerHeight - arrow1TopOffset;
		
		if (yTop<softMargin) {
			a = yArrow - cornerHeight - arrow1TopOffset - softMargin;
			if (a<0) a = 0;
			b = d - a;
			yTop = yArrow - a - cornerHeight - arrow1TopOffset;
		}
		
		if (yTop<softMargin) {
			yTop = yArrow - arrow3TopOffset + Math.round(lineHeight/2);
			a = 0;
			b = previewHeight - arrow3Height - cornerHeight;
			arrowMode = 3;
		}
		
		if (yTop<hardMargin) {
			yTop = hardMargin;
			yArrow = yTop + arrow3TopOffset;
			arrowMode = 3;
		}
		
		var arrow1Shift = 7;
	}
	else {
		var yTop = yArrow - a - cornerHeight - arrow2TopOffset;
		
		var arrow1Shift = 5;
	}
	
	var arrowShadow1 = document.getElementById("psa1");
	var arrowShadow2 = document.getElementById("psa2");
	var arrowShadow3 = document.getElementById("psa3");
	
	arrowShadow1.style.top = String(cornerHeight+a) + "px";
	arrowShadow2.style.top = String(previewHeight-arrow2Height) + "px";
	
	var pslA = document.getElementById("pslA");
	pslA.style.height = String(a) + "px";
	
	var pslB = document.getElementById("pslB");
	pslB.style.height = String(b) + "px";
	
	if (arrowMode==3) {
		pslB.style.top = String(arrow3Height) + "px";
	}
	else {
		pslB.style.top = String(cornerHeight+a+arrow1Height) + "px";
	}
	
	previewContent.style.top = String(scrollOffset+yTop) + "px";
	
	var previewShadow = document.getElementById("previewShadow");
	previewShadow.style.left = previewContent.style.left;
	previewShadow.style.top = previewContent.style.top;
	
	var previewArrows = document.getElementById("previewArrows");
	previewArrows.style.left = previewContent.style.left;
	previewArrows.style.top = previewContent.style.top;
	
	previewShadow.style.height = String(previewHeight) + "px";
	
	var shadowRight = document.getElementById("psr");
	shadowRight.style.height = String(previewHeight-2*cornerHeight) + "px";
	
	var border = document.getElementById("previewBorder");
	border.style.height = String(previewHeight) + "px";
	border.style.left = previewContent.style.left;
	border.style.top = previewContent.style.top;
	
	var background = document.getElementById("previewBackground");
	background.style.height = String(previewHeight) + "px";
	background.style.left = previewContent.style.left;
	background.style.top = previewContent.style.top;
	
	var pa1 = document.getElementById("pa1");
	var pa3 = document.getElementById("pa3");
	
	pa1.style.top = String(cornerHeight+a+arrow1Shift) + "px";	
	
	var psbl = document.getElementById("psbl");
	psbl.style.top = String(previewHeight-cornerHeight) + "px";
	
	var psbr = document.getElementById("psbr");
	psbr.style.top = String(previewHeight-cornerHeight) + "px";
	
	var pstl = document.getElementById("pstl");
	
	if (arrowMode==1) {
		arrowShadow1.style.display = "block";
		arrowShadow2.style.display = "none";
		arrowShadow3.style.display = "none";
		psbl.style.display = "block";
		pstl.style.display = "block";
		pa1.style.display = "block";
		pa3.style.display = "none";
	}
	else if (arrowMode==2) {
		arrowShadow1.style.display = "none";
		arrowShadow2.style.display = "block";		
		arrowShadow3.style.display = "none";
		psbl.style.display = "none";
		pstl.style.display = "block";
		pa1.style.display = "block";
		pa3.style.display = "none";
	}
	else if (arrowMode==3) {
		arrowShadow1.style.display = "none";
		arrowShadow2.style.display = "none";
		arrowShadow3.style.display = "block";
		psbl.style.display = "block";
		pstl.style.display = "none";
		pa1.style.display = "none";
		pa3.style.display = "block";
	}
	
}

function getViewportDimensions() {
	var viewportWidth;
	var viewportHeight;

	if (typeof window.innerWidth != "undefined") {
		viewportWidth = window.innerWidth;
		viewportHeight = window.innerHeight;
	}
	else if (typeof document.documentElement != "undefined" && typeof document.documentElement.clientWidth != "undefined" && document.documentElement.clientWidth != 0) {
		viewportWidth = document.documentElement.clientWidth;
		viewportHeight = document.documentElement.clientHeight;
	}
	else {
		viewportWidth = document.getElementsByTagName("body")[0].clientWidth;
		viewportHeight = document.getElementsByTagName("body")[0].clientHeight;
	}
	
	return {height: parseFloat(viewportHeight), width: parseFloat(viewportWidth)};
}

function findPosX(obj) {
	var curleft = 0;
	if (obj.offsetParent) {
		while (1) {
			curleft += obj.offsetLeft;
			if (!obj.offsetParent) break;
			obj = obj.offsetParent;
		}
	}
	else if(obj.x) curleft += obj.x;
	return curleft;
}

function findPosY(obj) {
	var curtop = 0;
	if (obj.offsetParent) {
		while (1) {
			curtop += obj.offsetTop;
			if(!obj.offsetParent) break;
			obj = obj.offsetParent;
		}
	}
	else if(obj.y) curtop += obj.y;
	return curtop;
}

function getStyle(oElm, strCssRule){
	var strValue = "";
	if(document.defaultView && document.defaultView.getComputedStyle){
		strValue = document.defaultView.getComputedStyle(oElm, "").getPropertyValue(strCssRule);
	}
	else if(oElm.currentStyle){
		strCssRule = strCssRule.replace(/\-(\w)/g, function (strMatch, p1){
			return p1.toUpperCase();
		});
		strValue = oElm.currentStyle[strCssRule];
	}
	return strValue;
}

function onRollOverList(evt) {
	if (evt.target) var target = evt.target;
	else if (evt.srcElement) var target = evt.srcElement;
	
	if (target.tagName=="A") {
		var obj = window.document.getElementById(target.id);
		if (obj!=null) openPreview(target.id);
	}
}

function onRollOutList(evt) {
	if (evt.target) var target = evt.target;
	else if (evt.srcElement) var target = evt.srcElement;
	
	if (evt.relatedTarget) var relTarget = evt.relatedTarget;
	else if (evt.toElement) var relTarget = evt.toElement;
	
	if (!(target.tagName=="A" && relTarget==target.parentNode) && !(target.tagName=="LI" && checkForMatch(target, relTarget)) && !checkForMatch(document.getElementById("previewContainer"), relTarget)) closePreview();
}

function onMouseOutPreview(evt) {
	if (evt.relatedTarget) var relTarget = evt.relatedTarget;
	else if (evt.toElement) var relTarget = evt.toElement;
	
	if (currPreviewID!=null) {
		var item = document.getElementById(currPreviewID);
		if (relTarget!=item && relTarget!=item.parentNode && !checkForMatch(document.getElementById("previewContainer"), relTarget)) closePreview();
	}	
}

function checkForMatch(parentObj, matchObj) {
	if (parentObj==matchObj) return true;
	var children = parentObj.childNodes;
	for (var i=0; i<children.length; i++) {
		if (checkForMatch(children[i], matchObj)) return true;
	}
	return false;
}

function init() {

	window.onresize = updatePreviewPosition;
	window.onscroll = updatePreviewPosition;

	var listContainer = document.getElementById("listContainer");	
	if (listContainer.addEventListener) {
		listContainer.addEventListener("mouseover", onRollOverList, false); 
		listContainer.addEventListener("mouseout", onRollOutList, false); 
	}
	else if (listContainer.attachEvent) {
		listContainer.attachEvent("onmouseover", onRollOverList);
		listContainer.attachEvent("onmouseout", onRollOutList);
	}
	
	var previewContainer = document.getElementById("previewContainer");
	if (previewContainer.addEventListener){
		previewContainer.addEventListener("mouseout", onMouseOutPreview, false); 
	}
	else if (previewContainer.attachEvent){
		previewContainer.attachEvent("onmouseout", onMouseOutPreview);
	}
}
