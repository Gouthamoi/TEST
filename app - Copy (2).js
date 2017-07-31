/*
 * Copyright IBM Corp. 2016,2017
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

"use strict";

// The API URL, along with the host and content hub id for your tenant, may be
// found in the "Hub Information" dialog off the "User menu" in the authoring UI
// Update the following URL with the value from that Hub Information dialog.
const baseTenantAPIURL = "https://my7.digitalexperience.ibm.com/api/22708d89-7809-4fac-ac93-dfde8000227e";

const hostUrl = window.location.origin + window.location.pathname;
// Empty elements for Article content type
var emptyElements = {
    "description": {
        "elementType": "text",
        "value": ""
    },
	 "title": {
        "elementType": "text",
        "value": ""
    },
  
    "file": {
        "elementType": "file",
        "asset": {}
    },
      "industry": {
        "elementType": "text",
        "value": ""
    },
      "category": {
        "elementType": "text",
        "value": ""
    },
	 "bu": {
        "elementType": "text",
        "value": ""
    },
	 "tag": {
        "elementType": "text",
        "value": ""
    }
	
};

const wchLoginURL = baseTenantAPIURL + "/login/v1/basicauth";
const contentService = "authoring/v1/content";
const resourceService = "authoring/v1/resources";
const assetService = "authoring/v1/assets";
const searchService = "authoring/v1/search";
var username="smrutipd@in.ibm.com";
var password="aug@2016";
var assetJson = "";
var globalAssetTag;
var globalAssetID;
var testJSON;
wchLogin(username, password,
          function() { // On successful login hide login form, show UI
              $(".mainContainer").removeClass("hidden");
          }
        );

function wchLogin(username, password, cb) {
    //alert("U: " + username + " P: " + password + " URL: " + wchLoginURL);
    var requestOptions = {
        xhrFields: { withCredentials: true },
        url: wchLoginURL,
        headers: { "Authorization": "Basic " + btoa(username + ":" + password) }
    };
    $.ajax(requestOptions).done(function(data, textStatus, request) {
        cb();
       // IBMCore.common.widget.overlay.show('overlayExampleLarge'); return false;
        //console.log(data);
    }).fail(function(request, textStatus, err) {
        let errMsg = (request && request.responseJSON && request.responseJSON.errors && request.responseJSON.errors[0].message) ?
            request.responseJSON.errors[0].message : err;
        alert("Content Hub Login returned an error: " + errMsg + " Please Try Again.");
    });
}

// Login, upload resource, create asset, and create content item
function createContentItem(contentTypeName, contentName,  file, textData) {
    // start with a copy of the empty elements structure for article content type
    var elements = JSON.parse(JSON.stringify(emptyElements));
     console.log(assetJson, "<<<<testJSON");
            if (assetJson.mediaType=="image/jpeg"){
                console.log(elements);
                elements['image'] = {};
                        elements.image.elementType = "image";
                        elements.image.asset = {
                            id: assetJson.id
                        };
                        elements.image.renditions = {};
                        console.log(elements);
                        elements.image.renditions.default = {
                                renditionId: assetJson.renditions["default"].id
                        };
                        console.log(elements);
                         
            }
            else
            {

                var file = elements.file;
                        file.elementType = "file";
                        file.asset = {
                            id: assetJson.id
                        };

                        console.log(file);
                       
            }
           
    var searchParams = "q=*:*&fl=name,id&wt=json&fq=classification:content-type&fq=name:" + contentTypeName;
   
            return wchSearch(searchParams).then(function(searchResults) {
            if (searchResults.numFound == 0) {
                return Promise.reject('Content type not found: ' + contentTypeName);
            }
            var id = searchResults.documents[0].id;
            var contentTypeId = id.substring(id.indexOf(":") + 1);
            // Populate all the text fields in the elements
            Object.keys(textData).forEach(function(key) {
                elements[key].value = textData[key];
            });
            // 5. create content item
            return wchCreateContentItem(contentName, contentTypeId, elements);
        });
};




// Upload a file to create a resource. Must have done login already.
function wchCreateResource(file) {
    var createResourceUrl = baseTenantAPIURL + '/' + resourceService + "?name=" + file.name;
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open("post", createResourceUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.onload = function() {
            if (this.status >= 200 && this.status < 300) {
                console.log('OK');
                 console.log(xhr.response);
                resolve(JSON.parse(xhr.response));
               
            } else {
                console.log('bad HTTP status');
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function() {
            console.log('error');
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send(file);
    });
}

// Creates an asset from a resource ID
function wchCreateAssetFromResource(resourceId, filename) {
    var createAssetUrl = baseTenantAPIURL + '/' + assetService;
    var reqOptions = {
        xhrFields: {
            withCredentials: true
        },
        dataType: "json",
        type: "POST",
        data: JSON.stringify({ resource: resourceId, path: '/dxdam/' + filename, name: filename }),
         async: false,
         global: false,
         withCredentials:false,
        contentType: "application/json",
        // mediaType: mimeType,
        url: createAssetUrl
    };
    // Post to assets service
    return $.ajax(reqOptions).done(function(json) {        
        wchassetTag(json.id);
        assetTitleDesc(json);
        //console.log(json, "Hi this is test");
        return json;
    });
}

//This is for getting tag forimages
//This below is used for getting the assetID
function assetTitleDesc(titleDesc){
    testJSON=titleDesc;
$("#sample-create-title").val(titleDesc.metadata.title);
$("#sample-create-summary").val(titleDesc.metadata.description);
}
function wchassetTag(assetID){
globalAssetID=assetID;
}


//This is used for using to get Tag information for the image
function wchAssetData(param){
   // console.log(param);
var tagsValueURL = baseTenantAPIURL + '/' + assetService + "/" + param;
var reqOptions = {
        xhrFields: {
            withCredentials: true
        },
        dataType: "json",
         async: false,
         global: false,
         withCredentials:false,
        url: tagsValueURL,
    };
    return $.ajax(reqOptions).then(function(json) {
     return json;
    });
}

//This is used for dispalying the tags in UI

function wchAssetTagSet(tagsValue){
$(".loader").hide();    
globalAssetTag=tagsValue.tags;
var assetTagKey = tagsValue.tags;
var x = assetTagKey.values;
var tagvalues=[];
$.each(assetTagKey, function(key, val) {
    $.each(val, function(index,value){
        var app = value.substring(value.indexOf(":") + 1);
        $('#testBox').append("<ul id='tagsWrap'><li>"+app+"</li> <li id=tagRemove_"+index+" class='removeClass'> X </li></ul>");
            })
            //remove tags from UI......
                $('li.removeClass').on("click",function(e) { 
                var id = $(this).attr('id');
                $(this).parent().remove();
                });
});

}



// Search - callback has search results object
function wchSearch(searchParams) {
    // console.log('searchParams: ', searchParams);
    var searchURL = baseTenantAPIURL + '/' + searchService + "?" + searchParams;
    var reqOptions = {
        xhrFields: {
            withCredentials: true
        },
        dataType: "json",
         async: false,
         global: false,
         withCredentials:false,
        url: searchURL,
    };
    return $.ajax(reqOptions).then(function(json) {
        return json;
    });
}

// Search - callback has search results object
function wchcontentSearch(searchParams) {
    $("#main-page-loader").css("display", "block");
    var spl = searchParams.split(",");
    //var obj=JSON.stringify(spl);
    //var finalParams= obj.replace(/[\[\]']+/g,'');
    var str = "";
    for(var i=0; i < spl.length ; i++){
        if(i == 0)
            str = str + "\"" + spl[i] + "\"";
            else
                str = str + ",\"" + spl[i] + "\"";
    }
    
   //alert(finalParams);
       var searchURL = baseTenantAPIURL + '/' + searchService + "?q=*:*&defType=edismax&indent=on&qf=name+type+description+creator+locale+lastModifier+tags+categories+text&wt=json&fq=classification:(content)&fq=tags:("+str+")&fq=type:(%22dsgtemplate%22)&&fl=*&document:[json]&wt=json&rows=50";
     
       var reqOptions = {
        xhrFields: {
            withCredentials: true
        },
        dataType: "json",
         async: false,
         global: false,
         withCredentials:false,
        url: searchURL,
    };
    $.ajax(reqOptions).then(function(json) {
       console.log("jaon : "+json);
        searchItem(json)
            
          });
}
//show search results in UI
function searchItem(param){
    var obj=param.documents;
    var url = '';
    var urlForShow = "";
        $.each(obj, function(key, val) {
             var jsonObj = JSON.parse(val.document); 
        
         if(jsonObj.elements.hasOwnProperty('image')){
             url= baseTenantAPIURL + val.thumbnail;
             urlForShow = baseTenantAPIURL + val.thumbnail;
          
          }
          else{
              url = baseTenantAPIURL + jsonObj.elements.file.asset.resourceUri;
              urlForShow = hostUrl + 'images/fileImage.png';
          
          }
      

       $("#retriveAlldata").append( '<div class="ibm-col-5-1" data-widget="setsameheight" data-items=".ibm-card">'+
        
     '  <div class="ibm-card">'+
        
           '<div class="ibm-card__content">'+ '<p class="ibm-textcolor-blue-50 ibm-h4">'+jsonObj.name+'</p>' +
             '</div>' + 
              ' <div class="ibm-card__image">'+'<img src=" ' + urlForShow + '" width="200" height="120">'+
                     '<a style="position: absolute;" class="ibm-download-link"   href="'+url+'" download></a>'+
          '</div>' +   
               '  <div class="ibm-card__bottom">'+  '<p>'+jsonObj.elements.description.value+'</p>'+
                '</div>' +    
          
       
          '</div>' +          
  
     '</div>');


   
     });
}

    $("#tagclick").click(function(){
         var x = document.getElementById('myDIV');
    if (x.style.display === 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
    }
    });



// create content item - callback has new content item object
function wchCreateContentItem(name, contentTypeId, contentElements) {
    console.log('createContentItem baseTenantAPIURL: ', contentElements);
    var arrTag = contentElements["tag"].value.split(',');
    arrTag = arrTag.concat(globalAssetTag.values);
    var createContentUrl = baseTenantAPIURL + '/' + contentService;
    var data = {
        "name": name,
        "typeId": contentTypeId,
        "tags": arrTag,
        "status": "draft",
        "links": {},
        "elements": contentElements
    };
    var reqOptions = {
        xhrFields: {
            withCredentials: true
        },
        dataType: "json",
        contentType: "application/json",
        type: "POST",
         async: false,
         global: false,
         withCredentials:false,
        data: JSON.stringify(data),
        url: createContentUrl
    };
    // console.log(JSON.stringify(reqOptions, "", 4));
    // Post to Content service
    return $.ajax(reqOptions).done(function(json) {
        return json;
    });

}


//fileupload 
function uploadAsset(file){
    if (!file) {
        return Promise.reject('No image file specified');
    }
	return wchCreateResource(file) // Upload resource and create asset
        .then(function(resourceJson) {
            var id = resourceJson.id;
            // console.log("resource: ", resourceJson);
            // 3. Create asset using ID from resource upload
            return wchCreateAssetFromResource(id, file.name);
        }).then(function(json){
            assetJson = json;
			var id = json.id;
			wchAssetTags(id);
		});
}

function wchAssetTags(id){
	var tagsValueURL = baseTenantAPIURL + '/' + assetService + "/" + id;
var reqOptions = {
        xhrFields: {
            withCredentials: true
        },
        dataType: "json",
         async: false,
         global: false,
         withCredentials:false,
        url: tagsValueURL,
    };
    $.ajax(reqOptions).then(function(json) {
        console.log("tags :: "+ json);
        if(json.tags.analysis ==  "pending"){
            wchAssetTags(id);
        }     
     else{
     wchAssetTagSet(json);
     
     }
    //return json;
    });
}
