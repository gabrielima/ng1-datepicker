(function(document, angular) {
  'use strict';

  angular
    .module('datepickerModule', [])
    .directive('datepicker', ['$timeout', '$filter', Datepicker]);

  function Datepicker($timeout, $filter) {
    var DatepickerTemplate =
      '<div class="datepicker" id="datepicker_{{$id}}">' +
        '<div ng-transclude></div>' +

        '<div class="datepicker__modal" tabindex="1" ng-show="opened" ng-blur="onBlur()">' +
          '<div class="datepicker__header">' +
            '<div class="datepicker__prev">' +
              '<i class="datepicker__prevYear" ng-click="controls(-1, \'Y\')"> &#171; </i>' +
              '<i class="datepicker__prevMonth" ng-click="controls(-1, \'M\')"> &#8249; </i>' +
            '</div>' +

            '<span class="datepicker__monthYear">{{ monthYear }}</span>' +

            '<div class="datepicker__next">' +
              '<i class="datepicker__nextMonth" ng-click="controls(1, \'M\')"> &#8250; </i>' +
              '<i class="datepicker__nextYear" ng-click="controls(1, \'Y\')"> &#187; </i>' +
            '</div>' +
          '</div>' +

          '<div class="datepicker__names">' +
            '<span ng-repeat="d in dayNames">' +
              '<span>{{ d }}</span>' +
            '</span>' +
          '</div>' +

          '<div class="datepicker__cells">' +
            '<span ng-repeat="d in days">' +
              '<span class="datepicker__cell" ng-click="selectDate($event, d)" ng-class="{disabled: !d.enabled}">' +
                '{{ d.day }}' +
              '</span>' +
            '</span>' +
          '</div>' +
        '</div>' +
      '</div>';


    var DatepickerLink = function (scope, elem, attrs, ngModel) {
      var input = elem[0].querySelector('input[type=text]');

      if (!input) {
        console.log('Datepicker directive: Input not found.');
        return;
      }

      var inputElement = angular.element(input);

      scope.opened = false;
      scope.days = [];
      scope.dayNames = [];
      scope.monthYear = null;

      var date = moment();

      var generateDatepicker = function () {
        var lastDayOfMonth = date.endOf('month').date();
        var month = date.month();
        var year = date.year();
        var n = 1;

        var firstWeekDay = date.set('date', 2).day();
        if (firstWeekDay !== 1) {
          n -= firstWeekDay - 1;
        }

        if (n == 2) n = -5;

        scope.monthYear = date.format('MMMM YYYY');
        scope.days = [];

        for (var i = n; i <= lastDayOfMonth; i += 1) {
          if (i > 0) {
            scope.days.push({
              day: i,
              date: moment(i + '/' + (month + 1) + '/' + year, 'DD/MM/YYYY').format('DD/MM/YYYY'),
              enabled: true
            });
          } else {
            scope.days.push({
              day: null,
              date: null,
              enabled: false
            });
          }
        }
      };

      var generateDayNames = function () {
        var date = moment('2015-06-07');
        for (var i = 0; i < 7; i += 1) {
          scope.dayNames.push(date.format('ddd'));
          date.add('1', 'd');
        }
      };

      generateDayNames();

      scope.closeDatepicker = function () {
        scope.opened = false;
      };

      scope.controls = function (i, option) {
        date.add(i, option);
        generateDatepicker();
      };

      scope.selectDate = function (event, selected) {
        event.preventDefault();
        ngModel.$render(selected.date);
        scope.closeDatepicker();
      };

      scope.onBlur = function () {
        var modal = elem[0].querySelector('.datepicker__modal');

        $timeout(function () {
          var val = inputElement.val();
          var activeElement = document.activeElement;

          var isActive =
            activeElement.isEqualNode(input) ||
            activeElement.isEqualNode(modal);

          if (isActive) return true;

          if (val && !toDatetime(val)._isValid)
            handleError();

          else {
            ngModel.$render(val);
          }

          scope.closeDatepicker();
        });
      };

      scope.onFocus = function () {
        scope.opened = true;
        generateDatepicker(scope.date);
        scope.$apply();
      };

      scope.onKeyup = function (event) {
        var val = inputElement.val();
        scope.closeDatepicker();

        if (!((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105)) &&
          event.key !== 'Backspace') {
          event.preventDefault();
          return;
        }

        if (((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105))) {
          if (val.length === 2 || val.length === 5)
            inputElement.val(val += '/');

          ngModel.$render(inputElement.val());
        }
      };

      scope.onKeypress = function (event) {
        var val = inputElement.val();

        if (val.length === 10 && event.key !== 'Backspace') {
          event.preventDefault();
          return;
        }
      };

      inputElement
        .on('focus', scope.onFocus)
        .on('keyup', scope.onKeyup)
        .on('keypress', scope.onKeypress)
        .on('blur focusout', scope.onBlur)
        .attr('id', 'datepicker_input_' + scope.$id);

      ngModel.$render = function (viewValue) {
        viewValue = viewValue !== undefined ? viewValue : angular.copy(ngModel.$viewValue);

        if (viewValue) {
          viewValue = toDatetime(viewValue);

          var valueFormat = viewValue.format('DD/MM/YYYY');
          if (viewValue._isValid) {
            ngModel.$setViewValue(valueFormat);
            inputElement.val(valueFormat);
            scope.monthYear = valueFormat;
            handleSuccess();
          } else {
            handleError();
          }
        } else {
          ngModel.$setViewValue(null);
          inputElement.val(null);
          handleSuccess();
        }
      };

      var toDatetime = function (date) {
        return moment(date, 'DD/MM/YYYY', true);
      };

      var handleError = function () {
        ngModel.$setValidity('pattern', false);
        var group = angular.element(elem[0].querySelector('.input-group'));
        return !group.hasClass('has-error') &&
          group.addClass('has-error');
      };

      var handleSuccess = function () {
        ngModel.$setValidity('pattern', true);
        var group = angular.element(elem[0].querySelector('.input-group'));
        return group.removeClass('has-error');
      };
    };

    return {
      restrict: 'E',
      replace: true,
      scope: {},
      require: 'ngModel',
      transclude: true,
      template: DatepickerTemplate,
      link: DatepickerLink
    };
  }
})(document, angular);