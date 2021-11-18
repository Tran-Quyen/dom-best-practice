// Đối tượng Validator
function Validator(options) {
  function getParent(element, selector) {
    while (element.parentElement) {
      // Kiểm tra xem cha của element có class selector truyền vào k0
      if (element.parentElement.matches(selector)) {
        return element.parentElement; //Nếu có trả về
      }
      //Gán lại cấp cho element = cha của nó để tìm lên trên
      element = element.parentElement;
    }
  }

  // variable để lưu các rule
  var selectorRules = {};

  // Hàm thực hiện validate
  function validate(inputEl, rule) {
    var errorEl = getParent(inputEl, options.formGroupSelector).querySelector(
      options.errorSelector
    );
    var errorMessage;
    //lấy ra các rules của selector
    var rules = selectorRules[rule.selector];

    // Lặp qua từng rule & check
    // Nếu có lỗi thì dừng kiểm tra
    for (var i = 0; i < rules.length; ++i) {
      // Xét trường hợp nếu là input thường hoặc là radio hay checkbox (nhiều input)
      switch (inputEl.type) {
        case 'radio':
        case 'checkbox':
          errorMessage = rules[i](formEl.querySelector(rule.selector + ':checked')); //check các rule và gán error cho errorMessage
          break;
        default:
          errorMessage = rules[i](inputEl.value); //check các rule và gán error cho errorMessage
          break;
      }

      if (errorMessage) break; //Nếu có errorMessage hay errorMessage !== undefined thì break khỏi vòng lặp
    }

    // In ra lỗi nếu có
    if (errorMessage) {
      errorEl.innerText = errorMessage;
      getParent(inputEl, options.formGroupSelector).classList.add('invalid');
    } else {
      //Không in ra lỗi
      errorEl.innerText = '';
      getParent(inputEl, options.formGroupSelector).classList.remove('invalid');
    }

    return !errorMessage; //convert to boolean
  }

  // Lấy element của form cần validate
  var formEl = document.querySelector(options.form);
  if (formEl) {
    // Khi submit
    formEl.onsubmit = function (e) {
      e.preventDefault(); // Bỏ đi hành vi mặc định khi submit

      var isFormValid = true;

      // Lặp qua từng rules và validate
      options.rules.forEach(function (rule) {
        var inputEl = formEl.querySelector(rule.selector);
        var isValid = validate(inputEl, rule);
        if (!isValid) {
          isFormValid = false;
        }
      });

      if (isFormValid) {
        // Trường hợp submit với js
        if (typeof options.onSubmit === 'function') {
          var enableInputs = formEl.querySelectorAll('[name]:not([disable])'); //select tất cả có attr là name và k0 có disable
          //convert sang array và convert sang object
          var formValues = Array.from(enableInputs).reduce(function (values, input) {
            // Xét trường hợp input thường với multi input (radio,checkbox)
            switch (input.type) {
              case 'radio':
                values[input.name] = formEl.querySelector(
                  `input[name="${input.name}"]:checked`
                ).values;
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
          options.onSubmit(formValues);
        }
        // Trường hợp submit với hành vi mặc định
        else {
          // Submit với hành động mặc định
          formEl.submit();
        }
      }
    };

    // Lặp qua mỗi rule và xử lý(lắng nghe blur,input,...)
    options.rules.forEach((rule) => {
      // Lưu lại các rules cho mỗi input
      if (Array.isArray(selectorRules[rule.selector])) {
        // Khi đã là mảng thì push các rule tiếp theo vào
        selectorRules[rule.selector].push(rule.check);
      } else {
        //Trong lần đầu nếu nó k0 phải là mảng thì tạo mảng với rule.check đầu tiên
        selectorRules[rule.selector] = [rule.check];
      }

      var inputEls = formEl.querySelectorAll(rule.selector);

      // Convert NodeList sang array
      Array.from(inputEls).forEach((inputEl) => {
        // lắng nghe sự kiện onblur (khi đang focus click chuột ra ngoài)
        //1. Xử lý trường hợp blur ra khỏi input
        inputEl.onblur = function () {
          // value: inputEl.value
          // test: func: rule.check
          validate(inputEl, rule);
        };

        // oninput là khi người dùng đang nhập vào input
        // Xử lý trường hợp mỗi khi người dùng nhập vào input
        inputEl.oninput = function () {
          var errorEl = getParent(inputEl, options.formGroupSelector).querySelector(
            options.errorSelector
          );
          errorEl.innerText = '';
          getParent(inputEl, options.formGroupSelector).classList.remove('invalid');
        };
      });
    });
  }
}

// Định nghĩa các rules
// Nguyên tắc của các rules:
// 1. Khi có lỗi => Trả ra message lỗi
// 2. Khi hợp lệ => Không trả ra cái gì cả (undefined)
Validator.isRequired = function (selector, message) {
  return {
    selector: selector,
    check: function (value) {
      return value ? undefined : message || 'Vui lòng nhập trường này!';
    },
  };
};
Validator.isFullName = function (selector, message) {
  return {
    selector: selector,
    check: function (value, message) {
      var regex = /^(?=.*[\/\^\(\?\=\.\*\[\-\+\=\_\)\(\\\*\&\^\%\$\#\@\!\~\”\’\:\;\|\}\]])/; // regex here
      return !regex.test(value.trim())
        ? undefined
        : message || 'Họ và Tên không được chứa ký tự đặc biệt!';
    },
  };
};
Validator.isEmail = function (selector, message) {
  return {
    selector: selector,
    check: function (value) {
      var regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
      return regex.test(value) ? undefined : message || 'Trường này phải là email!';
    },
  };
};

/*
  RegEx	                      Sự miêu tả
  ^                           Chuỗi mật khẩu sẽ bắt đầu theo cách này
  (? =. * [a-z])              Chuỗi phải chứa ít nhất 1 ký tự chữ cái viết thường
  (? =. * [A-Z])              Chuỗi phải chứa ít nhất 1 ký tự chữ cái viết hoa
  (? =. * [0-9])              Chuỗi phải chứa ít nhất 1 ký tự số (\d <=> [0-9])
  (? =. { 8,}$)               Chuỗi phải có tám ký tự trở lên
  (? =. { 8,20}$)             Chuỗi phải có tám ký tự trở lên và tối đa 20 ký tự
  (?=.*[\/\^\(\?\=\.\*\[\-\+\=\_\)\(\\\*\&\^\%\$\#\@\!\~\”\’\:\;\|\}\ \]])  Chuỗi phải chứa ít nhất một ký tự đặc biệt, nhưng chúng tôi đang thoát các ký tự RegEx dành riêng để tránh xung đột
*/
Validator.isStrongPassword = function (selector, min, max) {
  return {
    selector: selector,
    check: function (value) {
      var hasCharacter = /^(?=.*[a-zA-Z])/;
      var hasLowerCase = /^(?=.*[a-z])/;
      var hasUpperCase = /^(?=.*[A-Z])/;
      var hasNumber = /^(?=.*\d)/; //  \d <=> [0-9]
      var hasSpecialCharacter =
        /^(?=.*[\/\^\(\?\=\.\*\[\-\+\=\_\)\(\\\*\&\^\%\$\#\@\!\~\”\’\:\;\|\}\ \]])/;
      var hasMinCharacter = new RegExp(`^(?=.{${min},}$)`);
      var hasMaxCharacter = new RegExp(`^(?=.{${min},${max}}$)`);

      if (!hasMinCharacter.test(value)) {
        return `Mật khẩu phải có tối thiểu ${min} ký tự!`;
      } else if (!hasNumber.test(value)) {
        return `Mật khẩu phải có ít nhất 1 chữ số!`;
      } else if (!hasCharacter.test(value)) {
        return `Mật khẩu phải có ít nhất 1 chữ cái!`;
      } else if (!hasUpperCase.test(value)) {
        return `Mật khẩu phải có ít nhất 1 chữ hoa!`;
      } else if (!hasLowerCase.test(value)) {
        return `Mật khẩu phải có ít nhất 1 chữ thường!`;
      } else if (hasSpecialCharacter.test(value)) {
        return `Mật khẩu không được chứa ký tự đặc biệt!`;
      } else if (!hasMaxCharacter.test(value)) {
        return `Mật khẩu chỉ được chứa tối đa ${max} ký tự!`;
      } else {
        return undefined;
      }
    },
  };
};
Validator.isConfirmed = function (selector, getConfirmValue, message) {
  return {
    selector: selector,
    check: function (value) {
      return value === getConfirmValue()
        ? undefined
        : message || 'Giá trị nhập vào không chính xác!';
    },
  };
};
