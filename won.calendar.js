/**
* @file won.calendar.js
* @details : 월선택 캘린더 추가, 연선택 캘린더 추가
* @version : 0.0.3
* @authors : kyowon shin(sk@realbiz.kr)
* @see shinkw.com
**/
;(function(){
  won.Calendar = function(options){
    options = $.extend({
      target:null,
      //{
      //  wrapper:"#searchBar .date-wrapper",
      //  start:"#searchBar input[name='startDt']",
      //  end:"#searchBar input[name='endDt']",
      //}
      pickerType:'single',
      pickerDateType:'date',
      headerBtns:true, // 머리버튼 기본오픈
      showWdates:true, // 요일뷰 기본오픈
      prevMonth:'<',
      nextMonth:'>',
      format:'YYYY-MM-DD',
      autoClose:true,
      onOpen:null,
      onClose:null,
      maxDt:null,
      minDt:null,
      position:{},
      colors:{
        sun:'red',
        mon:'',
        tue:'',
        wed:'',
        thur:'',
        fri:'',
        sat:'blue'
      },
      btns:{}
    }, options);

    var self = this;
    var dateWrapper = '';
    var startField = '';
    var endField = '';
    var defaultDt = moment().format('YYYY-MM-DD'); // 기본값은 오늘
    var defaultStartDt;
    var currentDt;
    var currentYear;
    var currentMonth;
    var wrapper;
    var activeInput;
    var selectedDt = {
      start:'',
      end:''
    };

    var _isDomElem = function(obj){
      if(obj instanceof HTMLCollection && obj.length) {
        for(var a = 0, len = obj.length; a < len; a++) {
          if(!checkInstance(obj[a])){
            return false;
          }
        }
        return true;
      }else{
        return checkInstance(obj);  
      }

      function checkInstance(elem) {
        if((elem instanceof jQuery && elem.length) || elem instanceof HTMLElement){
          return true;
        }
        return false;
      }
    };

    var _initFields = function(){ // 입력폼 세팅
      if(_isDomElem(options.target)){ // target이 dom element인 경우
        dateWrapper = options.target;
      }else{
        // wrapper 세팅
        if($.type(options.target) == 'string'){
          dateWrapper = $(options.target);
        }else if($.type(options.target) == 'object' && $.type(options.target.wrapper) != 'undefined'){
          if(_isDomElem(options.target.wrapper)){
            dateWrapper = options.target.wrapper;
          }else{
            dateWrapper = $(options.target.wrapper);
          }
        }else{
          console.error('unknown datepicker wrapper');
          return false;
        }
      }
      if(dateWrapper[0].nodeName === 'INPUT'){ // target이 input인 경우
        dateWrapper.after("<div></div>");
        dateWrapper = dateWrapper.next('div');
        if(_isDomElem(options.target)){
          startField = options.target;
        }else{
          startField = $(options.target);
        }
      }else{
        // startField 생성
        if($.type(options.target.start) != 'undefined'){
          if(_isDomElem(options.target)){
            startField = options.target.start;
          }else{
            startField = $(options.target.start);
          }
        }else{
          startField = dateWrapper.find("input:not([type='hidden']):first-child");
        }
      }
      
      if($.type(startField) == 'undefined'){
        console.error('unknown datepicker target');
        return false;
      }
      dateWrapper.addClass("won-picker-area");

      if(options.pickerType == 'range'){
        // endField 생성
        if($.type(options.target.end) != 'undefined'){
          if(_isDomElem(options.target.end)){
            endField = options.target.end;
          }else{
            endField = $(options.target.end);
          }
        }else{
          endField = dateWrapper.find("input:not([type='hidden']):last-child");
        }
      }
      // 여기까지 모든 과정이 정상적으로 완료됐다면 true 반환
      return true;
    };
    
    
    var _initDefaultDt = function(){ // 기본날짜 세팅
      if(startField.val() != ''){ // startField에 값이 있다면 그 값을 default값으로 세팅해줌 없다면 오늘임
        defaultDt = moment(startField.val()).format('YYYY-MM-DD'); // 기본날짜 세팅
      }

      // 기본날짜 선택되어있음
      selectedDt.start = defaultDt;
      if(options.pickerType == 'range'){ // 범위선택인 경우 종료일 세팅
        selectedDt.end = defaultDt;
        if(endField.val() != ''){ // endfield에 값이 있다면
          selectedDt.end = moment(endField.val()).format('YYYY-MM-DD'); // endfield 날짜 선택
        }
      }
      defaultStartDt = moment(defaultDt).startOf('month').format('YYYY-MM-DD'); // 기본날짜의 시작일(1일)
      currentDt = defaultStartDt;
    };

    var _makeCalendar = function(){ // 캘린더를 만들어줌
      var newWrapper = false;
      if($.type(wrapper) == 'undefined'){
        newWrapper = true;
        wrapper = $('<div class="calendar-wrapper"></div>'); // 캘린더 wrapper 생성
      }
      if(options.headerBtns){ // 상단버튼 활성화
        var showPrev = '<div style="width:37px;display:inline-block;>&nbsp;</div>';
        var showNext = '<div style="width:37px;display:inline-block;>&nbsp;</div>';
        if(options.minDt == null || moment(options.minDt) <= moment(currentDt).subtract(1, 'month')){
          showPrev = $('<a href="javascript:void(0);" class="prev">'+options.prevMonth+'</a>').click(function(e){ // 전월
            e.stopImmediatePropagation();
            _makePrevCalendar();
          });
        }
        var showYears = $('<a href="javascript:void(0);">'+moment(currentDt).format('YYYY년')+'</a>').click(function(e){ // 연 보여주기
          e.stopImmediatePropagation();
          currentYear = moment(currentDt).format('YYYY');
          currentMonth = moment(currentDt).format('M');
          _makeYearsCalendar();
        });
        var showMonths = $('<a href="javascript:void(0);">'+moment(currentDt).format('M월')+'</a>').click(function(e){ // 월 보여주기
          e.stopImmediatePropagation();
          currentYear = moment(currentDt).format('YYYY');
          currentMonth = moment(currentDt).format('M');
          _makeMonthsCalendar();
        });
        if(options.maxDt == null || moment(options.maxDt) >= moment(currentDt).add(1, 'month')){
          showNext = $('<a href="javascript:void(0);" class="next">'+options.nextMonth+'</a>').click(function(e){ // 다음달
            e.stopImmediatePropagation();
            _makeNextCalendar();
          });
        }
        wrapper.append('<div class="headerBtns-wrapper"><div class="headerBtns"></div></div>'); // 캘린더 wrapper에 추가
        wrapper.find(".headerBtns").append(showPrev).append(showYears).append(showMonths).append(showNext); // wrapper의 헤더버튼에 각 버튼 추가
      }
      if(options.showWdates){ // 요일 활성화
        var wdate = $("<ul class='wdates'><li style='color:"+options.colors.sun+";'>일</li><li style='color:"+options.colors.mon+";'>월</li><li style='color:"+options.colors.tue+";'>화</li><li style='color:"+options.colors.wed+";'>수</li><li style='color:"+options.colors.thur+";'>목</li><li style='color:"+options.colors.fri+";'>금</li><li style='color:"+options.colors.sat+";'>토</li></ul>");
        wrapper.append(wdate);
      }

      if(newWrapper){
        dateWrapper.append(wrapper); // 폼에 캘린더 추가
        wrapper.wrap('<div class="picker-wrapper"></div>');
      }else{
        dateWrapper.find('.picker-wrapper').append(wrapper);
      }

      if(!won.libs.isEmpty(options.position)){
        if(!won.libs.isEmpty(options.position.top)){
          dateWrapper.find('.picker-wrapper').css({left:options.position.top});
        }
        if(!won.libs.isEmpty(options.position.right)){
          dateWrapper.find('.picker-wrapper').css({left:options.position.right});
        }
        if(!won.libs.isEmpty(options.position.bottom)){
          dateWrapper.find('.picker-wrapper').css({left:options.position.bottom});
        }
        if(!won.libs.isEmpty(options.position.left)){
          dateWrapper.find('.picker-wrapper').css({left:options.position.left});
        }
      }

      var startWeekDayOfMonth = moment(currentDt).startOf('month').format('d'); // 시작일의 요일
      var lastDtOfLast = moment(currentDt).subtract(1, 'month').format('D'); // 지난달의 마지막날
      var lastDtOfCurrent = moment(currentDt).endOf('month').format('DD'); // 이번달의 마지막날

      var weekno = 1; // 주 count초기화
      var dt = 1;
      var cntOfweek = 0; // 주당 며칠 생성했는지 계산용
      while(dt <= lastDtOfCurrent){ // 마지막날까지 루프
        if(wrapper.find("ul[weekno='"+weekno+"']").length == 0){ // 해당하는 주의 행이 생성되지 않았다면
          wrapper.append('<ul weekno="'+weekno+'"></ul>'); // 생성
        }
        if(dt == 1){ // 1일인 경우
          for($i=startWeekDayOfMonth; $i>0; $i--){ // 시작일의 요일까지 루프
            var date = moment(currentDt).subtract($i, 'day'); // $i일 이전
            wrapper.find("ul[weekno='"+weekno+"']").append('<li class="last-month" data-wdate="'+date.format('d')+'" data-date="'+date.format('YYYY-MM-DD')+'">'+date.format('D')+'</li>'); // 전월 날짜 세팅
            cntOfweek++;
          }
        }

        var date = moment(currentDt).add((dt-1), 'day'); // dt-1일만큼 추가
        var selDate = $('<li data-wdate="'+date.format('d')+'" data-date="'+date.format('YYYY-MM-DD')+'">'+date.format('D')+'</li>');
        if((options.minDt != null && moment(selDate.data('date')) < moment(options.minDt)) || (options.maxDt != null && moment(selDate.data('date')) > moment(options.maxDt))){
          selDate.addClass('disabled');
        }
        wrapper.find("ul[weekno='"+weekno+"']").append(selDate); // 생성

        cntOfweek++;
        if(cntOfweek == 7){ // 7개 모두 생성했다면
          cntOfweek = 0; // 다시 일요일
          weekno++; // 다음주
        }
        dt++; // 날짜 추가
        if(dt > lastDtOfCurrent && date.format('d') < 6){ // 마지막날이 지났는데 토요일이 아니라면
          date = moment(currentDt).add((dt-1), 'day'); // 하루씩 추가
          for($i = date.format('d'); $i<=6; $i++){ // 토요일까지
            wrapper.find("ul[weekno='"+weekno+"']").append('<li class="next-month" data-wdate="'+date.format('d')+'" data-date="'+date.format('YYYY-MM-DD')+'">'+date.format('D')+'</li>'); // 다음달의 날짜를 추가해줌
            dt++;
            date = moment(currentDt).add((dt-1), 'day');
          }
        }
      }
      
      _bindSelectDate(); // 선택시 동작 바인딩
      _showCalendar();
      _bindManualInput(); // 수동입력시
      _bindInrangeDates();
    };

    var _makeMonthsCalendar = function(){ // 월 캘린더 생성
      var newWrapper = false;
      if($.type(wrapper) == 'undefined'){
        newWrapper = true;
        wrapper = $('<div class="calendar-wrapper"></div>'); // 캘린더 wrapper 생성
      }else{
        _destroyCalendar();
      }
      currentYear = moment(currentDt).format('YYYY');
      var showPrev = '<div style="display:inline-block;width:37px">&nbsp</div>';
      var showNext = '<div style="display:inline-block;width:37px">&nbsp</div>';
      if(options.minDt == null || currentYear - 1 >= moment(options.minDt).format('YYYY')){
        showPrev = $('<a href="javascript:void(0);" class="prev">'+options.prevMonth+'</a>').click(function(e){ // 작년
          e.stopImmediatePropagation();
          currentYear = currentYear - 1;
          currentDt = currentYear+'-01-01';
          _makeMonthsCalendar();
        });
      }
      var showYears = $('<a href="javascript:void(0);">'+currentYear+'년</a>').click(function(e){ // 연 보여주기
        e.stopImmediatePropagation();
        _makeYearsCalendar();
      });

      if(options.maxDt == null || Number(currentYear) + 1 <= moment(options.maxDt).format('YYYY')){
        showNext = $('<a href="javascript:void(0);" style="width:37px" class="next">'+options.nextMonth+'</a>').click(function(e){ // 내년
          e.stopImmediatePropagation();
          currentYear = Number(currentYear) + 1;
          currentDt = currentYear+'-01-01';
          _makeMonthsCalendar();
        });
      }

      wrapper.append('<div class="headerBtns-wrapper"><div class="headerBtns"></div></div>'); // 캘린더 wrapper에 추가
      wrapper.find(".headerBtns").append(showPrev).append(showYears).append(showNext); // wrapper의 헤더버튼에 각 버튼 추가

      var months = 1;
      for($i=1; $i<=12; $i++){
        if(wrapper.find("ul[months='"+months+"']").length == 0) wrapper.append('<ul months="'+months+'"></ul>');
        var month = $('<li class="'+(($i == currentMonth)?'current-month':'')+'" data-month="'+currentYear+'-'+(($i < 10)?'0':'')+$i+'">'+$i+'월</li>');
        if((options.minDt != null && moment(month.data('month')) < moment(options.minDt)) || (options.maxDt != null && moment(month.data('month')) > moment(options.maxDt))){
          month.addClass("disabled");
        }
        wrapper.find("ul[months='"+months+"']").append(month);
        if($i % 3 == 0) months++;
      }

      if(newWrapper){
        dateWrapper.append(wrapper); // 폼에 캘린더 추가
        wrapper.wrap('<div class="picker-wrapper"></div>');
      }else{
        dateWrapper.find('.picker-wrapper').append(wrapper);
      }

      if(!won.libs.isEmpty(options.position)){
        if(!won.libs.isEmpty(options.position.top)){
          dateWrapper.find('.picker-wrapper').css({left:options.position.top});
        }
        if(!won.libs.isEmpty(options.position.right)){
          dateWrapper.find('.picker-wrapper').css({left:options.position.right});
        }
        if(!won.libs.isEmpty(options.position.bottom)){
          dateWrapper.find('.picker-wrapper').css({left:options.position.bottom});
        }
        if(!won.libs.isEmpty(options.position.left)){
          dateWrapper.find('.picker-wrapper').css({left:options.position.left});
        }
      }
      _showCalendar();
      _bindSelectMonth();
    };

    var _makeYearsCalendar = function(year){ // 연 캘린더 생성
      var newWrapper = false;
      if($.type(wrapper) == 'undefined'){
        newWrapper = true;
        wrapper = $('<div class="calendar-wrapper"></div>'); // 캘린더 wrapper 생성
      }else{
        _destroyCalendar();
      }
      currentYear = moment(currentDt).format('YYYY');

      if($.type(year) == 'undefined') year = currentYear;
      year = Number(year);
      
      var showPrev = '<div style="width:37px;display:inline-block;>&nbsp;</div>';
      var showNext = '<div style="width:37px;display:inline-block;>&nbsp;</div>';
      
      if(options.minDt == null || moment(options.minDt).format('YYYY') <= year-5){
        showPrev = $('<a href="javascript:void(0);" class="prev">'+options.prevMonth+'</a>').click(function(e){ // 전월
          e.stopImmediatePropagation();
          _makeYearsCalendar(year-9);
        });
      }

      var showYears = $('<a href="javascript:void(0);">'+(year-4)+'~'+(year+4)+'</a>').click(function(e){ // 연 보여주기
        e.stopImmediatePropagation();
      });

      if(options.maxDt == null || moment(options.maxDt).format('YYYY') >= year+5){
        showNext = $('<a href="javascript:void(0);" class="next">'+options.nextMonth+'</a>').click(function(e){ // 다음달
          e.stopImmediatePropagation();
          _makeYearsCalendar(year+9);
        });
      }
      wrapper.append('<div class="headerBtns-wrapper"><div class="headerBtns"></div></div>'); // 캘린더 wrapper에 추가
      wrapper.find(".headerBtns").append(showPrev).append(showYears).append(showNext); // wrapper의 헤더버튼에 각 버튼 추가
      
      var years = 1;
      for($i=-4, $j=1; $i<=4; $i++, $j++){
        if(wrapper.find("ul[years='"+years+"']").length == 0) wrapper.append('<ul years="'+years+'"></ul>');
        var selYear = $('<li class="'+((year == currentYear)?'current-month':'')+'" data-year="'+(Number(year)+$i)+'">'+(Number(year)+$i)+'</li>');

        if((options.minDt != null && (Number(year)+$i) < moment(options.minDt).format('YYYY')) || (options.maxDt != null && (Number(year)+$i) > moment(options.maxDt).format('YYYY'))){
          selYear.addClass("disabled");
        }
        wrapper.find("ul[years='"+years+"']").append(selYear);
        if($j % 3 == 0) years++;
      }

      if(newWrapper){
        dateWrapper.append(wrapper); // 폼에 캘린더 추가
        wrapper.wrap('<div class="picker-wrapper"></div>');
      }else{
        dateWrapper.find('.picker-wrapper').append(wrapper);
      }
      if(!won.libs.isEmpty(options.position)){
        if(!won.libs.isEmpty(options.position.top)){
          dateWrapper.find('.picker-wrapper').css({left:options.position.top});
        }
        if(!won.libs.isEmpty(options.position.right)){
          dateWrapper.find('.picker-wrapper').css({left:options.position.right});
        }
        if(!won.libs.isEmpty(options.position.bottom)){
          dateWrapper.find('.picker-wrapper').css({left:options.position.bottom});
        }
        if(!won.libs.isEmpty(options.position.left)){
          dateWrapper.find('.picker-wrapper').css({left:options.position.left});
        }
      }
      _bindSelectYear();
      _showCalendar();
    };

    var _makeCalendarBtns = function(){
      if(options.btns.length == 0) return false;
      wrapper.parents('.picker-wrapper').addClass('with-btns');
      var btnWrapper = $('<div class="picker-btn-wrapper"></div>');
      wrapper.parents('.picker-wrapper').append(btnWrapper);
      $.each(options.btns, function(k, btn){
        var b = $('<a href="#" class="btn">'+btn.label+'</a>').click(function(e){
          e.preventDefault();
          if($.type(btnActions[btn.action]) == 'function'){
            btnActions[btn.action]();
            _destroyCalendar();
            if(!won.libs.isEmpty(selectedDt.end)){
              currentDt = moment(selectedDt.end).startOf('month').format('YYYY-MM-DD');
            }else{
              currentDt = moment(selectedDt.start).startOf('month').format('YYYY-MM-DD');
            }
            if(options.pickerDateType == 'year'){
              _makeYearsCalendar();
            }else if(options.pickerDateType == 'month'){
              _makeMonthsCalendar();
            }else{
              _makeCalendar();
            }
            _showCalendar();
          }
        });
        btnWrapper.append(b);
      });
    };

    var _showCalendar = function(){
      startField.unbind('focus');
      startField.focus(function(){
        if(!$(this).attr('disabled') && !$(this).attr('readonly')){
          wrapper.parent().show();
          dateWrapper.addClass('active');
          activeInput = 'start';
        }
      });
      
      if(options.pickerType == 'range'){
        endField.unbind('focus');
        endField.focus(function(){
          if(!$(this).attr('disabled') && !$(this).attr('readonly')){
            wrapper.parent().show();
            dateWrapper.addClass('active');
            activeInput = 'end';
          }
        });
      }
    };

    var _bindSelectDate = function(){
      wrapper.find("li[data-date]").unbind('click');
      wrapper.find("li[data-date]").click(function(){
        if($(this).hasClass('disabled')){
          return false;
        }else{
          if(activeInput == 'start'){
            _setStartDt($(this).data('date')); // 날짜선택
            // input에 값 입력해줌
            startField.val(selectedDt.start);
            if(options.pickerType == 'range'){
              endField.focus();
            }else{
              if(options.autoClose === true){
                _closeCalendar();
              }
            }
          }else if(activeInput == 'end'){
            _setEndDt($(this).data('date')); // 날짜선택
            // input에 값 입력해줌
            endField.val(selectedDt.end);
            if(options.autoClose === true){
              _closeCalendar();
            }
          }
        }
      });
    };

    var _bindSelectMonth = function(){
      wrapper.find("li[data-month]").unbind('click');
      wrapper.find("li[data-month]").click(function(e){ // 월 선택시 동작
        e.stopImmediatePropagation();
        if($(this).hasClass('disabled')){
          return false;
        }else{
          if(options.pickerDateType == 'month'){
            /*
            if(options.pickerType == 'range'){
              var selectDt = moment($(this).data('month')+'-01').startOf('month').format('YYYY-MM-DD');
              if(selectedDt.start == ''){ // 현재 선택되어있는 날짜가 없다면
                _setStartDt(selectDt); // 시작일을 선택한거임
              }else if(selectedDt.end == ''){ // 시작일은 선택되어있으나 종료일이 선택되어있지 않다면
                if(moment(selectedDt.start) > moment(selectDt)){ // 현재 선택된 날짜가 기존 선택된 시작일보다 작다면 시작일을 바꿔줌
                  var endTmp = moment(selectedDt.start).endOf('month').format('YYYY-MM-DD');
                  _setStartDt(selectDt);
                  _setEndDt(endTmp);
                }else{ // 그렇지 않다면 종료일을 바꿔줌
                  _setEndDt(moment(selectDt).endOf('month').format('YYYY-MM-DD'));
                }
                if(options.autoClose === true){
                  _closeCalendar();
                }
              }else{ // 둘다 선택되어있다면
                _setStartDt(selectDt);
                _setEndDt('');
              }
            }else{
              _setStartDt(moment($(this).data('month')).format('YYYY-MM')); // 날짜선택
            }
            */
            var selectDt = moment($(this).data('month')+'-01').startOf('month').format('YYYY-MM-DD');
            if(activeInput == 'start'){
              _setStartDt(moment($(this).data('month')).format('YYYY-MM')); // 날짜선택
              // input에 값 입력해줌
              startField.val(moment(selectedDt.start).format(options.format));
              if(options.pickerType == 'range'){
                endField.focus();
              }
            }else if(activeInput == 'end'){
              _setEndDt(moment($(this).data('month')).format('YYYY-MM')); // 날짜선택
              endField.val(moment(selectedDt.end).format(options.format));
              if(options.autoClose == true){
                _closeCalendar();
              }
            }
            //_bindInrangeDates();
          }else{
            _destroyCalendar();
            var m = $(this).data('month');
            currentDt = moment(m).format('YYYY-MM-DD');
            _makeCalendar();
            _showCalendar();
          }
        }
      });
    };

    var _bindSelectYear = function(){
      wrapper.find("li[data-year]").unbind('click');
      wrapper.find("li[data-year]").click(function(e){
        e.stopImmediatePropagation();
        if($(this).hasClass('disabled')){
          return false;
        }else{
          if(options.pickerDateType == 'year'){
            if(activeInput == 'start'){
              _setStartDt($(this).data('year')+'-01-01');
              if(options.pickerType == 'range'){
                endField.focus();
              }else if(options.autoClose){
                _closeCalendar();
              }
            }else if(activeInput == 'end'){
              _setEndDt($(this).data('year')+'-12-31');
              if(options.autoClose){
                _closeCalendar();
              }
            }
            /*
            if(options.pickerType == 'range'){
              if(selectedDt.start == ''){ // 현재 선택되어있는 날짜가 없다면
                _setStartDt($(this).data('year')); // 시작일을 선택한거임
              }else if(selectedDt.end == ''){ // 시작일은 선택되어있으나 종료일이 선택되어있지 않다면
                if(moment(selectedDt.start) > moment($(this).data('year'))){ // 현재 선택된 날짜가 기존 선택된 시작일보다 작다면 시작일을 바꿔줌
                  var startTmp = $(this).data('month');
                  var endTmp = selectedDt.start;
                  _setStartDt(startTmp);
                  _setEndDt(endTmp);
                }else{ // 그렇지 않다면 종료일을 바꿔줌
                  _setEndDt($(this).data('month'));
                }
                if(options.autoClose === true){
                  _closeCalendar();
                }
              }else{ // 둘다 선택되어있다면
                _setStartDt($(this).data('month'));
                _setEndDt('');
              }
            }else{
              _setStartDt($(this).data('year')+'-01-01'); // 날짜선택
            }
            // input에 값 입력해줌
            startField.val(moment(selectedDt.start).format(options.format));
            if(options.pickerType == 'range'){
              endField.val(moment(selectedDt.end).format(options.format));
            }
            */
          }else{
            _destroyCalendar();
            currentDt = $(this).data('year')+'-01-01';
            _makeMonthsCalendar();
            _showCalendar();
          }
        }
      });
    };

    var _setStartDt = function(date){
      if(options.pickerDateType == 'date'){
        wrapper.find("li[data-date='"+selectedDt.start+"']").removeClass("selected");
        wrapper.find("li[data-date='"+date+"']").addClass("selected");
      }else if(options.pickerDateType == 'month'){
        wrapper.find("li[data-month='"+moment(selectedDt.start).format('YYYY-MM')+"']").removeClass("selected");
        wrapper.find("li[data-month='"+moment(date).format('YYYY-MM')+"']").addClass("selected");
      }else if(options.pickerDateType == 'year'){
        wrapper.find("li[data-year='"+moment(selectedDt.start).format('YYYY')+"']").removeClass("selected");
        wrapper.find("li[data-year='"+moment(date).format('YYYY')+"']").addClass("selected");
      }
      selectedDt.start = date;
      startField.val(moment(selectedDt.start).format(options.format));
      _bindInrangeDates();
    };

    var _setEndDt = function(date){
      if(options.pickerDateType == 'date'){
        wrapper.find("li[data-date='"+selectedDt.end+"']").removeClass("selected");
        wrapper.find("li[data-date='"+date+"']").addClass("selected");
      }else if(options.pickerDateType == 'month'){
        wrapper.find("li[data-month='"+moment(selectedDt.end).format('YYYY-MM')+"']").removeClass("selected");
        wrapper.find("li[data-month='"+moment(date).format('YYYY-MM')+"']").addClass("selected");
        wrapper.find("li[data-month='"+moment(date).format('YYYY-MM')+"']").removeClass('range');
      }else if(options.pickerDateType == 'year'){
        wrapper.find("li[data-year='"+moment(selectedDt.end).format('YYYY')+"']").removeClass("selected");
        wrapper.find("li[data-year='"+moment(date).format('YYYY')+"']").removeClass('range').addClass("selected");
      }
      selectedDt.end = date;
      endField.val(moment(selectedDt.end).format(options.format));
      _bindInrangeDates();
      if(endField.val() == 'Invalid date') endField.val('');
      //if(date != '')
        //_closeCalendar();
        //wrapper.hide();
    };

    var _bindManualInput = function(){ // 수동입력시 동작
      var allowKeys = [109, 189, 36, 35, 46, 8, 40, 37, 38, 39, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57];
      startField.keydown(function(e){
        if(e.ctrlKey && (e.keyCode == 17 || e.keyCode == 65 || e.keyCode == 67 || e.keyCode == 86 || e.keyCode == 36 || e.keyCode == 35 || e.keyCode == 82)){ // 전체선택, 복붙, 새로고침 등 허용
        }else if(e.keyCode == 13){
          e.stopImmediatePropagation();
          //_closeCalendar();
        }else if(allowKeys.indexOf(e.keyCode) < 0){ // 허용되지 않은 키 입력시
          e.stopImmediatePropagation();
          return false;
        }
      }).keyup(function(e){
        if(allowKeys.indexOf(e.keyCode) > -1){
          if($(this).val().length > 3){ // 최소한 연도는 입력되어있어야 함
            if(new Date($(this).val()) != 'Invalid Date'){ // 날짜 유형이 제대로된놈이라면
              // 입력한 월의 캘린더를 보여줌
              var insertDt = moment(new Date($(this).val())).format('YYYY-MM-01');
              if(insertDt != currentDt){
                _destroyCalendar();
                currentDt = insertDt;
                _makeCalendar();
                _showCalendar();
              }
            }
          }
        }else if(e.keyCode == 13){ // 엔터 입력시
          e.stopImmediatePropagation();
          // 입력한 날짜를 시작일로 세팅
          var inputDt = moment($(this).val()).format('YYYY-MM-DD');
          _setStartDt(inputDt);
          currentDt = insertDt;
          _closeCalendar();
        }
      }).focusout(function(){ // focusout시
        // 입력한 날짜를 시작일로 세팅
        /*
        var inputDt = moment($(this).val()).format('YYYY-MM-DD');
        _setStartDt(inputDt);
        currentDt = inputDt;
        _closeCalendar();
        */
      });
      
      if(options.pickerType == 'range'){
        endField.keydown(function(e){
          if(e.ctrlKey && (e.keyCode == 17 || e.keyCode == 65 || e.keyCode == 67 || e.keyCode == 86 || e.keyCode == 36 || e.keyCode == 35 || e.keyCode == 82)){ // 전체선택, 복붙, 새로고침 등 허용
          }else if(e.keyCode == 13){
            e.stopImmediatePropagation();
            //_closeCalendar();
          }else if(allowKeys.indexOf(e.keyCode) < 0){ // 허용되지 않은 키 입력시
            e.stopImmediatePropagation();
            return false;
          }
        }).keyup(function(e){
          if(allowKeys.indexOf(e.keyCode) > -1){
            if($(this).val().length > 3){ // 최소한 연도는 입력되어있어야 함
              if(new Date($(this).val()) != 'Invalid Date'){ // 날짜 유형이 제대로된놈이라면
                // 입력한 월의 캘린더를 보여줌
                var insertDt = moment(new Date($(this).val())).format('YYYY-MM-01');
                if(insertDt != currentDt){
                  _destroyCalendar();
                  currentDt = inputDt;
                  _makeCalendar();
                  _showCalendar();
                }
              }
            }
          }else if(e.keyCode == 13){ // 엔터 입력시
            e.stopImmediatePropagation();
            // 입력한 날짜를 시작일로 세팅
            var inputDt = moment($(this).val()).format('YYYY-MM-DD');
            _setEndDt(inputDt);
            currentDt = insertDt;
            _closeCalendar();
          }
        }).focusout(function(){ // focusout시
          // 입력한 날짜를 시작일로 세팅
          /*
          var inputDt = moment($(this).val()).format('YYYY-MM-DD');
          _setEndDt(inputDt);
          currentDt = insertDt;
          _closeCalendar();
          */
        });
      }
    };

    var _bindInrangeDates = function(){ // 범위안에 있는 날짜들 표시
      if(selectedDt.startDt != ''){ // 시작일 설정되어있지 않으면 범위선택 하지 않음
        var start = selectedDt.start;
        if(options.pickerDateType == 'month'){
          start = moment(start).format('YYYY-MM');
        }else if(options.pickerDateType == 'year'){
          start = moment(start).format('YYYY');
        }
        wrapper.find("li[data-"+options.pickerDateType+"='"+start+"']").addClass("selected");

        if(selectedDt.endDt != ''){ // 종료일이 설정되어있다면
          var end = selectedDt.end;
          if(options.pickerDateType == 'month'){
            end = moment(end).format('YYYY-MM');
          }else if(options.pickerDateType == 'year'){
            end = moment(end).format('YYYY');
          }

          wrapper.find("li[data-"+options.pickerDateType+"='"+end+"']").addClass("selected");
          wrapper.find("li[data-"+options.pickerDateType+"].range").removeClass("range");
          wrapper.find("li[data-"+options.pickerDateType+"]").each(function(){
            var thisDt = $(this).data(options.pickerDateType);
            var sDt = $(this).data(options.pickerDateType);
            var eDt = $(this).data(options.pickerDateType);
            if(options.pickerDateType == 'month'){
              sDt = moment(thisDt).startOf('month').format('YYYY-MM-DD');
              eDt = moment(thisDt).endOf('month').format('YYYY-MM-DD');
            }else if(options.pickerDateType == 'year'){
              sDt = moment(thisDt).startOf('year').format('YYYY-MM-DD');
              eDt = moment(thisDt).endOf('year').format('YYYY-MM-DD');
            }          
            if(moment(sDt) > moment(selectedDt.start) && moment(eDt) < moment(selectedDt.end)){
              $(this).addClass("range");
            }
          });
        }
      }
    };

    var _makePrevCalendar = function(){ // 전월 캘린더 생성
      _destroyCalendar();
      currentDt = moment(currentDt).subtract(1, 'month').format('YYYY-MM-DD');
      _makeCalendar();
      _showCalendar();
    };

    var _makeNextCalendar = function(){ // 다음달 캘린더 생성
      _destroyCalendar();
      currentDt = moment(currentDt).add(1, 'month').format('YYYY-MM-DD');
      _makeCalendar();
      _showCalendar();
    };

    var _destroyCalendar = function(){
      if($.type(wrapper) != 'undefined'){
        wrapper.find('ul, .headerBtns-wrapper').remove();
      }
    };

    var _getSelected = function(){
      return selectedDt;
    };

    var _closeCalendar = function(){
      startField.val(moment(selectedDt.start).format(options.format));
      if(options.pickerType == 'range'){
        endField.val(moment(selectedDt.end).format(options.format));
      }
      //wrapper.hide();
      wrapper.parent().hide();
      //dateWrapper.find('.calendar-wrapper').hide();
      dateWrapper.removeClass('active');
      activeInput = undefined;
      $.isFunction(options.onClose) && options.onClose.apply(self, []);
    };

    var _closeOnOutside = function(){
      $(document).click(function(e){
        if(!$(e.target).closest(dateWrapper).length && !$(e.target).closest(wrapper.find('*')).length && !$(e.target).closest(wrapper).length && !$(e.target).closest(startField).length && !$(e.target).closest(endField).length){
          if(dateWrapper.hasClass('active')){
            _closeCalendar();
          }
        }
      });
    };

    var _init = function(){
      if(_initFields() == true){
        _initDefaultDt();
        if(options.pickerDateType == 'year'){
          _makeYearsCalendar();
        }else if(options.pickerDateType == 'month'){
          _makeMonthsCalendar();
        }else{
          _makeCalendar();
        }
        if(startField.val() != ''){
          _setStartDt(startField.val());
        }

        if($.type(endField) != 'undefined' && endField != '' && endField.val() != ''){
          _setEndDt(endField.val());
        }
        if(options.btns.length > 0){
          _makeCalendarBtns();
        }
        if(options.headerBtns){
          wrapper.parent().addClass('with-header-btns');
        }
        _closeOnOutside();
      }
    };
    
    var btnActions = {
      lastYear:function(){
        if(options.pickerType == 'range'){
          _setEndDt(moment(selectedDt.start).subtract(1, 'year').endOf('year').format('YYYY-MM-DD'));
        }
        _setStartDt(moment(selectedDt.start).subtract(1, 'year').startOf('year').format('YYYY-MM-DD'));
      },
      thisYear:function(){
        if(options.pickerType == 'range'){
          _setEndDt(moment().format('YYYY-MM-DD'));
        }
        _setStartDt(moment().startOf('year').format('YYYY-MM-DD'));
      },
      nextYear:function(){
        if(options.pickerType == 'range'){
          _setEndDt(moment(selectedDt.start).add(1, 'year').endOf('year').format('YYYY-MM-DD'));
        }
        _setStartDt(moment(selectedDt.start).add(1, 'year').startOf('year').format('YYYY-MM-DD'));
      },
      lastMonth:function(){
        if(options.pickerType == 'range'){
          _setEndDt(moment(selectedDt.start).subtract(1, 'month').endOf('month').format('YYYY-MM-DD'));
        }
        _setStartDt(moment(selectedDt.start).subtract(1, 'month').startOf('month').format('YYYY-MM-DD'));
      },
      thisMonth:function(){
        if(options.pickerType == 'range'){
          _setEndDt(moment().format('YYYY-MM-DD'));
        }
        _setStartDt(moment().startOf('month').format('YYYY-MM-DD'));
      },
      nextMonth:function(){
        if(options.pickerType == 'range'){
          _setEndDt(moment(selectedDt.start).add(1, 'month').endOf('month').format('YYYY-MM-DD'));
        }
        _setStartDt(moment(selectedDt.start).add(1, 'month').startOf('month').format('YYYY-MM-DD'));
      },
      yesterday:function(){
        if(options.pickerType == 'range'){
          _setEndDt(moment(selectedDt.start).subtract(1, 'day').format('YYYY-MM-DD'));
        }
        _setStartDt(moment(selectedDt.start).subtract(1, 'day').format('YYYY-MM-DD'));
      },
      today:function(){
        if(options.pickerType == 'range'){
          _setEndDt(moment().format('YYYY-MM-DD'));
        }
        _setStartDt(moment().format('YYYY-MM-DD'));
      },
      tomorrow:function(){
        if(options.pickerType == 'range'){
          _setEndDt(moment(selectedDt.start).add(1, 'day').endOf('day').format('YYYY-MM-DD'));
        }
        _setStartDt(moment(selectedDt.start).add(1, 'day').startOf('day').format('YYYY-MM-DD'));
      },
      lastWeek:function(){
        if(options.pickerType == 'range'){
          _setEndDt(moment(selectedDt.start).subtract(1, 'week').endOf('week').format('YYYY-MM-DD'));
        }
        _setStartDt(moment(selectedDt.start).subtract(1, 'week').startOf('week').format('YYYY-MM-DD'));
      },
      thisWeek:function(){
        if(options.pickerType == 'range'){
          _setEndDt(moment().endOf('week').format('YYYY-MM-DD'));
        }
        _setStartDt(moment().startOf('week').format('YYYY-MM-DD'));
      },
      nextWeek:function(){
        if(options.pickerType == 'range'){
          _setEndDt(moment(selectedDt.start).add(1, 'week').endOf('week').format('YYYY-MM-DD'));
        }
        _setStartDt(moment(selectedDt.start).add(1, 'week').startOf('week').format('YYYY-MM-DD'));
      }
    };

    this.getDates = function(){
      return _getSelected();
    };

    this.destroy = function(){
      _destroyCalendar();
    };

    this.close = function(){
      _closeCalendar();
    };

    _init();
  };
})();
