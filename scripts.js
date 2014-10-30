'use strict';

angular.module('mentio-demo', ['mentio'])


    .controller('mentio-demo-ctrl', function ($scope, $rootScope, $http, $q, $compile, $sce, $timeout, mentioUtil) {

        // Regex extract uid from the element
        // var myReg = new RegExp('<ment-user data-uid="([\\d]+)" contenteditable="false">([\\w]+)</ment-user>');
        // console.log('@employee[' + '<ment-user data-uid="5" contenteditable="false">Snir</ment-user>'.replace(myReg, "$1") + ']');

        // In the database the tagged user will be saved as: @employee[USER_ID] (like in the regex)
        // When getting the comment list and if there's some mention you'll need to implement a directive that take this
        // type of string an replace it back to the directive, also this directive can be used to be a link if needed.

        $scope.parse = function() {
            var content = $scope.htmlContent;

            var tagReplaceRegex = new RegExp('<ment-user data-uid="([\\d]+)" contenteditable="false">([\\w]+)</ment-user>', "g");

            var mentionElements = content.match(tagReplaceRegex);

            var mentions = [];

            angular.forEach(mentionElements, function(mention, index) {
                // Add to the mentions array the user id.
                mentions.push(mention.replace(tagReplaceRegex, "$1"))
            });

            // Mention user ids.
            console.log(mentions);

            content = content.replace(tagReplaceRegex, "@employee[$1]")

            // The body content that need to be sent to the server.
            console.log(content);
        }

        $scope.searchPeople = function(term) {
            var peopleList = [];
            return $http.get('peopledata.json').then(function (response) {
                angular.forEach(response.data, function(item) {
                    if (item.name.toUpperCase().indexOf(term.toUpperCase()) >= 0) {
                        peopleList.push(item);
                    }
                });
                $scope.people = peopleList;
                return $q.when(peopleList);
            });
        };

        $scope.mentions = [];

        $scope.getPeopleText = function(item) {
            if (!$scope.mentions.indexOf(item.id)) {
                $scope.mentions.push(item.id);
            }
            return '<ment-user data-uid="'+item.id+'" contenteditable="false">'+item.name+'</ment-user>';
        };

    })
    .directive('mentUser', ['$sce', function($sce) {
        return {
            restrict: 'E',
            template: '<div contenteditable="false" data-uid="{{uid}}" ng-transclude></div>',
            transclude: true,
            scope: {
                uid: '='
            },
            link: function(scope, element, attrs) {
                //console.log(attrs);
            }
        }
    }])
    .directive('contenteditable', ['$sce', function($sce) {
        return {
            restrict: 'A', // only activate on element attribute
            require: '?ngModel', // get a hold of NgModelController
            link: function(scope, element, attrs, ngModel) {
                function read() {
                    var html = element.html();
                    // When we clear the content editable the browser leaves a <br> behind
                    // If strip-br attribute is provided then we strip this out
                    if (attrs.stripBr && html === '<br>') {
                        html = '';
                    }
                    ngModel.$setViewValue(html);
                }

                if(!ngModel) return; // do nothing if no ng-model

                // Specify how UI should be updated
                ngModel.$render = function() {
                    if (ngModel.$viewValue !== element.html()) {
                        element.html($sce.getTrustedHtml(ngModel.$viewValue || ''));
                    }
                };

                // Listen for change events to enable binding
                element.on('blur keyup change', function() {
                    scope.$apply(read);
                });
                read(); // initialize
            }
        };
    }])
    .filter('words', function () {
        return function (input, words) {
            if (isNaN(words)) {
                return input;
            }
            if (words <= 0) {
                return '';
            }
            if (input) {
                var inputWords = input.split(/\s+/);
                if (inputWords.length > words) {
                    input = inputWords.slice(0, words).join(' ') + '\u2026';
                }
            }
            return input;
        };
    });
