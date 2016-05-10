(function () {
    'use-strict';

    angular.module('jkuri.gallery', ['angularFileUpload'])
      .directive('ngGallery', ngGallery)
      .directive('ngThumb', ngThumb);

    ngGallery.$inject = ['$document', '$timeout', '$q', '$templateCache', 'FileUploader'];

    function ngGallery($document, $timeout, $q, $templateCache, FileUploader) {

        var defaults = {
            baseClass: 'ng-gallery',
            thumbClass: 'ng-thumb',
            templateUrl: 'ng-gallery.html'
        };

        var keys_codes = {
            enter: 13,
            esc: 27,
            left: 37,
            right: 39
        };

        function setScopeValues(scope, attrs) {
            scope.baseClass = scope.class || defaults.baseClass;
            scope.thumbClass = scope.thumbClass || defaults.thumbClass;
            scope.thumbsNum = scope.thumbsNum || 3; // should be odd
        }

        var template_url = defaults.templateUrl;
        // Set the default template
        var template = `
        <div class="{{ baseClass }}">
        <div ng-repeat="i in images">
          <img
            ng-src="{{ i.thumb }}"
            class="{{ thumbClass }}"
            ng-click="openGallery($index)"
            alt="Image {{ $index + 1 }}" />
        </div>
        <div
          ng-if="uploadCallback"
          class="ng-gallery-add">
          <i
            class="fa fa-plus"
            ng-click="showAddImageDialog()"> </i>
        </div>
      </div>
      <div
        class="ng-overlay"
        ng-show="opened || addMoreOpened"></div>
      <div
        class="ng-gallery-content"
        unselectable="on"
        ng-show="opened"
        ng-swipe-left="nextImage()"
        ng-swipe-right="prevImage()">
        <div
          class="uil-ring-css"
          ng-show="loading">
          <div></div>
        </div>
        <a
          href="{{getImageDownloadSrc()}}"
          target="_blank"
          ng-show="showImageDownloadButton()"
          class="download-image">
          <i class="fa fa-download"></i>
        </a>
        <a
          class="close-popup"
          ng-click="closeGallery()">
          <i class="fa fa-close"></i>
        </a>
        <a
          class="nav-left"
          ng-click="prevImage()">
          <i class="fa fa-angle-left"></i>
        </a>
        <img
          ondragstart="return false;"
          draggable="false"
          ng-src="{{ img }}"
          ng-click="nextImage()"
          ng-show="!loading"
          class="effect" />
        <a
          class="nav-right"
          ng-click="nextImage()">
          <i class="fa fa-angle-right"></i>
        </a>
        <span class="info-text">{{ index + 1 }}/{{ images.length }} - {{ description }}</span>
        <div class="ng-thumbnails-wrapper">
          <div class="ng-thumbnails slide-left">
            <div ng-repeat="i in images">
              <img
                ng-src="{{ i.thumb }}"
                ng-class="{'active': index === $index}"
                ng-click="changeImage($index)" />
            </div>
          </div>
        </div>
      </div>
      <div
        unselectable="on"
        class="ng-gallery-file-upload-form"
        ng-show="addMoreOpened">
        <div class="row">
          <div class="col-md-3"></div>
          <div class="col-md-6 ng-gallery-file-upload-control">
            <a
              class="close-popup pull-right"
              ng-click="closeAddImageDialog()">
              <i class="fa fa-close"></i>
            </a>
            <div>
              <h3>Upload images</h3>
              <!--
                <div ng-show="uploader.isHTML5">
                  <div
                    class="well my-drop-zone"
                    nv-file-over=""
                    uploader="uploader">Drop images here</div>
                </div>
                -->
              <input
                type="file"
                nv-file-select=""
                uploader="uploader"
                filter="images/*"
                multiple /><br />
            </div>
            <div>
              <table class="table">
                <thead>
                  <tr>
                    <th width="50%">Name</th>
                    <th ng-show="uploader.isHTML5">Size</th>
                    <th ng-show="uploader.isHTML5">Progress</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr ng-repeat="item in uploader.queue">
                    <td><strong>{{ item.file.name }}</strong> <!-- Image preview --> <!--auto height--> <!--<div ng-thumb="{ file: item.file, width: 100 }"></div>-->
                      <!--auto width-->
                      <div
                        ng-show="uploader.isHTML5"
                        ng-thumb="{ file: item._file, height: 100 }"></div> <!--fixed width and height --> <!--<div ng-thumb="{ file: item.file, width: 100, height: 100 }"></div>-->
                    </td>
                    <td
                      ng-show="uploader.isHTML5"
                      nowrap>{{ item.file.size/1024/1024|number:2 }} MB</td>
                    <td ng-show="uploader.isHTML5">
                      <div
                        class="progress"
                        style="margin-bottom: 0;">
                        <div
                          class="progress-bar"
                          role="progressbar"
                          ng-style="{ 'width': item.progress + '%' }"></div>
                      </div>
                    </td>
                    <td class="text-center"><span ng-show="item.isSuccess"><i class="glyphicon glyphicon-ok"></i></span> <span ng-show="item.isCancel"><i
                          class="glyphicon glyphicon-ban-circle"></i></span> <span ng-show="item.isError"><i class="glyphicon glyphicon-remove"></i></span></td>
                    <td nowrap>
                      <button
                        type="button"
                        class="btn btn-success btn-xs"
                        ng-click="item.upload()"
                        ng-disabled="item.isReady || item.isUploading || item.isSuccess">
                        <span class="glyphicon glyphicon-upload"></span> Upload
                      </button>
                      <button
                        type="button"
                        class="btn btn-warning btn-xs"
                        ng-click="item.cancel()"
                        ng-disabled="!item.isUploading">
                        <span class="glyphicon glyphicon-ban-circle"></span> Cancel
                      </button>
                      <button
                        type="button"
                        class="btn btn-danger btn-xs"
                        ng-click="item.remove()">
                        <span class="glyphicon glyphicon-trash"></span> Remove
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div>
                <div>
                  Queue progress:
                  <div
                    class="progress"
                    style="">
                    <div
                      class="progress-bar"
                      role="progressbar"
                      ng-style="{ 'width': uploader.progress + '%' }"></div>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn btn-success btn-s"
                  ng-click="uploader.uploadAll()"
                  ng-disabled="!uploader.getNotUploadedItems().length">
                  <span class="glyphicon glyphicon-upload"></span> Upload all
                </button>
                <button
                  type="button"
                  class="btn btn-warning btn-s"
                  ng-click="uploader.cancelAll()"
                  ng-disabled="!uploader.isUploading">
                  <span class="glyphicon glyphicon-ban-circle"></span> Cancel all
                </button>
                <button
                  type="button"
                  class="btn btn-danger btn-s"
                  ng-click="uploader.clearQueue()"
                  ng-disabled="!uploader.queue.length">
                  <span class="glyphicon glyphicon-trash"></span> Remove all
                </button>
              </div>
            </div>
          </div>
        </div>
        `;

        $templateCache.put(template_url, template);
        
        return {
            restrict: 'EA',
            scope: {
                images: '=',
                thumbsNum: '@',
                hideOverflow: '=',
                uploadCallback: "=",
                uploadUrl: "="
            },
            controller: [
                '$scope',
                function ($scope) {
                    $scope.$on('openGallery', function (e, args) {
                        $scope.openGallery(args.index);
                    });
                    $scope.$on('addImage', function (e, args) {
                      $scope.addImage();
                    });
                    $scope.uploader = new FileUploader({
                      url: $scope.uploadUrl
                    });

                    $scope.uploader.filters.push({
                        name: 'imageFilter',
                        fn: function(item /*{File|FileLikeObject}*/, options) {
                            var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type.toLowerCase()) !== -1;
                        }
                    });
                }
            ],
            templateUrl: function (element, attrs) {
                return attrs.templateUrl || defaults.templateUrl;
            },
            link: function (scope, element, attrs) {
                setScopeValues(scope, attrs);

                if (scope.thumbsNum >= 11) {
                    scope.thumbsNum = 11;
                }

                var $body = $document.find('body');
                var $thumbwrapper = angular.element(element[0].querySelectorAll('.ng-thumbnails-wrapper'));
                var $thumbnails = angular.element(element[0].querySelectorAll('.ng-thumbnails'));

                scope.index = 0;
                scope.opened = false;
                
                scope.addMoreOpened = false;

                scope.thumb_wrapper_width = 0;
                scope.thumbs_width = 0;

                var loadImage = function (i) {
                    var deferred = $q.defer();
                    var image = new Image();

                    image.onload = function () {
                        scope.loading = false;
                        if (typeof this.complete === false || this.naturalWidth === 0) {
                            deferred.reject();
                        }
                        deferred.resolve(image);
                    };

                    image.onerror = function () {
                        deferred.reject();
                    };

                    image.src = scope.images[i].img;
                    scope.loading = true;

                    return deferred.promise;
                };

                var showImage = function (i) {
                    loadImage(scope.index).then(function (resp) {
                        scope.img = resp.src;
                        smartScroll(scope.index);
                    });
                    scope.description = scope.images[i].description || '';
                };

                scope.showImageDownloadButton = function () {
                    if (scope.images[scope.index] == null || scope.images[scope.index].downloadSrc == null) return
                    var image = scope.images[scope.index];
                    return angular.isDefined(image.downloadSrc) && 0 < image.downloadSrc.length;
                };

                scope.getImageDownloadSrc = function () {
                    if (scope.images[scope.index] == null || scope.images[scope.index].downloadSrc == null) return
                    return scope.images[scope.index].downloadSrc;
                };

                scope.changeImage = function (i) {
                    scope.index = i;
                    showImage(i);
                };

                scope.nextImage = function () {
                    scope.index += 1;
                    if (scope.index === scope.images.length) {
                        scope.index = 0;
                    }
                    showImage(scope.index);
                };

                scope.prevImage = function () {
                    scope.index -= 1;
                    if (scope.index < 0) {
                        scope.index = scope.images.length - 1;
                    }
                    showImage(scope.index);
                };

                scope.showAddImageDialog = function() {
                  scope.addMoreOpened = true;
                  if (scope.hideOverflow) {
                    $('body').css({overflow: 'hidden'});
                  }   
                };
                
                scope.uploadFiles = function() {
                  if (scope.uploadCallback) {
                    scope.uploadCallback();
                  }
                  scope.addMoreOpened = false;
                }
                
                scope.closeAddImageDialog = function () {
                  scope.addMoreOpened = false;
                  if (scope.hideOverflow) {
                      $('body').css({overflow: ''});
                  }
              };
              
                scope.openGallery = function (i) {
                    if (typeof i !== undefined) {
                        scope.index = i;
                        showImage(scope.index);
                    }
                    scope.opened = true;
                    if (scope.hideOverflow) {
                        $('body').css({overflow: 'hidden'});
                    }

                    $timeout(function () {
                        var calculatedWidth = calculateThumbsWidth();
                        scope.thumbs_width = calculatedWidth.width;
                        //Add 1px, otherwise some browsers move the last image into a new line
                        var thumbnailsWidth = calculatedWidth.width + 1;
                        $thumbnails.css({width: thumbnailsWidth + 'px'});
                        $thumbwrapper.css({width: calculatedWidth.visible_width + 'px'});
                        smartScroll(scope.index);
                    });
                };

                scope.closeGallery = function () {
                    scope.opened = false;
                    if (scope.hideOverflow) {
                        $('body').css({overflow: ''});
                    }
                };

                $body.bind('keydown', function (event) {
                    if (!scope.opened) {
                        return;
                    }
                    var which = event.which;
                    if (which === keys_codes.esc) {
                        scope.closeGallery();
                    } else if (which === keys_codes.right || which === keys_codes.enter) {
                        scope.nextImage();
                    } else if (which === keys_codes.left) {
                        scope.prevImage();
                    }

                    scope.$apply();
                });

                var calculateThumbsWidth = function () {
                    var width = 0,
                        visible_width = 0;
                    angular.forEach($thumbnails.find('img'), function (thumb) {
                        width += thumb.clientWidth;
                        width += 10; // margin-right
                        visible_width = thumb.clientWidth + 10;
                    });
                    return {
                        width: width,
                        visible_width: visible_width * scope.thumbsNum
                    };
                };

                var smartScroll = function (index) {
                    $timeout(function () {
                        var len = scope.images.length,
                            width = scope.thumbs_width,
                            item_scroll = parseInt(width / len, 10),
                            i = index + 1,
                            s = Math.ceil(len / i);

                        $thumbwrapper[0].scrollLeft = 0;
                        $thumbwrapper[0].scrollLeft = i * item_scroll - (s * item_scroll);
                    }, 100);
                };

            }
        };
    }
    
    ngThumb.$inject = ['$window'];
    function ngThumb($window) {
      var helper = {
          support: !!($window.FileReader && $window.CanvasRenderingContext2D),
          isFile: function(item) {
              return angular.isObject(item) && item instanceof $window.File;
          },
          isImage: function(file) {
              var type =  '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
              return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
          }
      };

      return {
          restrict: 'A',
          template: '<canvas/>',
          link: function(scope, element, attributes) {
              if (!helper.support) return;

              var params = scope.$eval(attributes.ngThumb);

              if (!helper.isFile(params.file)) return;
              if (!helper.isImage(params.file)) return;

              var canvas = element.find('canvas');
              var reader = new FileReader();

              reader.onload = onLoadFile;
              reader.readAsDataURL(params.file);

              function onLoadFile(event) {
                  var img = new Image();
                  img.onload = onLoadImage;
                  img.src = event.target.result;
              }

              function onLoadImage() {
                  var width = params.width || this.width / this.height * params.height;
                  var height = params.height || this.height / this.width * params.width;
                  canvas.attr({ width: width, height: height });
                  canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
              }
          }
      };
  }
})();
