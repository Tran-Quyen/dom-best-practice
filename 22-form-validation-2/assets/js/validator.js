// Validator 2
function Validator(formSelector) {
  var _this = this;
  var formRules = {};

  function getParent(element, selector) {
    while (element.parentElement) {
      // Kiểm tra bộ chọn của parentElement có matches với selector hay k0
      if (element.parentElement.matches(selector)) {
        return element.parentElement;
      }
      element = element.parentElement;
    }
  }

  // Quy ước tạo rule:
  // Nếu có lỗi thì return 'error message'
  // Nếu k0 có lỗi return về undefined
  var validatorRules = {
    required: function (value) {
      return value ? undefined : 'Vui lòng nhập trường này';
    },
    email: function (value) {
      var regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
      return regex.test(value) ? undefined : 'Trường này phải là email';
    },
    password: function () {
      return function (value, min, max) {
        var hasCharacter = /^(?=.*[a-zA-Z])/;
        var hasLowerCase = /^(?=.*[a-z])/;
        var hasUpperCase = /^(?=.*[A-Z])/;
        var hasNumber = /^(?=.*\d)/; //  \d <=> [0-9]
        var hasSpecialCharacter = /^(?=.*[\/\^\(\?\=\.\*\[\-\+\=\_\)\(\\\*\&\^\%\$\#\@\!\~\”\’\:\;\|\}\ \]])/;
        var hasMinCharacter = new RegExp(`^(?=.{${min},}$)`);
        var hasMaxCharacter = new RegExp(`^(?=.{${min},${max}}$)`);

        if (!hasMinCharacter.test(value)) {
          return `Mật khẩu phải chứa tối thiểu ${min} ký tự!`;
        }
        else if (!hasNumber.test(value)) {
          return `Mật khẩu phải có ít nhất 1 chữ số!`;
        }
        else if (!hasCharacter.test(value)) {
          return `Mật khẩu phải có ít nhất 1 chữ cái!`;
        }
        else if (!hasUpperCase.test(value)) {
          return `Mật khẩu phải có ít nhất 1 chữ hoa!`;
        }
        else if (!hasLowerCase.test(value)) {
          return `Mật khẩu phải có ít nhất 1 chữ thường!`;
        }
        else if (hasSpecialCharacter.test(value)) {
          return `Mật khẩu không được chứa ký tự đặc biệt!`;
        }
        else if (!hasMaxCharacter.test(value)) {
          return `Mật khẩu chỉ được nhập tối đa ${max} ký tự!`;
        }
        else {
          return undefined;
        }
      }
    }
  };

  //Lấy ra form element trong DOM theo `formSelector` 
  var formEl = document.querySelector(formSelector);

  // Chỉ xử lý khi có element trong DOM
  if (formEl) {
    // Lấy tất cả các element có 2 attr là name và rules
    var inputs = formEl.querySelectorAll('[name][rules]');//return NodeList

    for (var input of inputs) {
      // Lấy ra list rule
      var rules = input.getAttribute('rules').split('|');
      for (var rule of rules) {

        var ruleInfo;
        var isRuleHasValue = rule.includes(':');

        if (isRuleHasValue) {//Nếu có dấu : thì tách nó ra
          ruleInfo = rule.split(':');
          rule = ruleInfo[0];//Gán lại cho nó bằng rule password
        }

        var ruleFunc = validatorRules[rule];

        // Trong trường hợp là function lồng nhau
        if (isRuleHasValue) {
          ruleFunc = ruleFunc(ruleInfo[0]);
        }

        if (Array.isArray(formRules[input.name])) {
          // Từ lần thứ 2 push nó vào
          formRules[input.name].push(ruleFunc);
        } else {
          // Lần đầu giá trị đấy chưa phải là array nên ta gán nó thành array
          // và đưa function vào trong array
          formRules[input.name] = [ruleFunc];
        }
      }


      // Lắng nghe sự kiện để validate (blur,change,...)
      input.onblur = handleValidate;
      input.oninput = handleClearError;
    }

    // Hàm thực hiện validate
    function handleValidate(event) {
      var rules = formRules[event.target.name];
      var errorMessage;
      var isRulePassword = event.target.name == 'password';

      // Lặp qua các rules để kiểm tra xem có message lỗi hay k0
      for (var rule of rules) {
        // Nếu là password phải xử lý để lấy giá trị min và max
        if (isRulePassword) {
          // Đưa vào mảng đón 2 giá trị min,max trong array
          var [_, min, max] = event.target.getAttribute('rules').split(':');
          errorMessage = rule(event.target.value, min, max);
        }
        else {
          errorMessage = rule(event.target.value);
        }
        // Nếu có errorMessage break khỏi loop
        if (errorMessage) break;
      }

      // Nếu có lỗi thì hiển thị message lỗi ra UI
      if (errorMessage) {
        var formGroup = getParent(event.target, '.form-group');
        if (formGroup) {
          formGroup.classList.add('invalid');
          var formMessage = formGroup.querySelector('.form-message');

          if (formMessage) {
            formMessage.innerText = errorMessage;
          }
        }
      }
      return !errorMessage;//Ép sang boolean
    }

    // Hàm clear message lỗi
    function handleClearError(event) {
      var formGroup = getParent(event.target, '.form-group');
      if (formGroup.classList.contains('invalid')) {
        formGroup.classList.remove('invalid');
        var formMessage = formGroup.querySelector('.form-message');
        if (formMessage) {
          formMessage.innerText = '';
        }
      }
    }
  }

  // Xử lý hành vi submit form
  formEl.onsubmit = function (event) {
    event.preventDefault();

    var inputs = formEl.querySelectorAll('[name][rules]');//return NodeList
    var isValid = true;

    for (var input of inputs) {
      // parameter event => event.target => cần target đến element
      // => {target:input}.target = input 
      // Nếu có lỗi thì gán isValid = false
      if (!handleValidate({ target: input })) {
        isValid = false;
      }
    }

    // Khi không có lỗi thì submit form
    if (isValid) {
      if (typeof _this.onSubmit === 'function') {//Nếu là function thì submit theo method của form (bên ngoài).
        // Lấy data để Call API
        var enableInputs = formEl.querySelectorAll('[name]:not([disable])');//select tất cả có attr là name và k0 có disable
        //convert sang array và convert sang object
        var formValues = Array.from(enableInputs).reduce(function (values, input) {

          // Xét trường hợp input thường với multi input (radio,checkbox)
          switch (input.type) {
            case 'radio':
              values[input.name] = formEl.querySelector(`input[name="${input.name}"]:checked`).values;
              break;
            case 'checkbox':
              // Nếu k0 được check thì trả về
              if (!input.matches(':checked')) {
                return values;
              }
              // Nếu nó k0 là mảng thì cho nó thành mảng
              if (!Array.isArray(values[input.name])) {
                values[input.name] = [];
              }
              //Nếu là array thì push value được check vào
              values[input.name].push(input.value);
              break;
            case 'file':
              values[input.name] = input.files;
              break;
            default:
              values[input.name] = input.value;
              break;
          }

          return values;
        }, {});
        // Gọi lại hàm on submit và trả về kèm giá trị của form
        _this.onSubmit(formValues);//
      }
      else {//Ngược lại
        formEl.submit();//submit mặc định
      }
    }
  }
}

