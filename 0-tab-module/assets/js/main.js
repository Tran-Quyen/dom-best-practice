const $ = document.querySelector.bind(document); //=> JQuery
const $$ = document.querySelectorAll.bind(document); // NodeList

const tabs = $$('.tab-item');
const panes = $$('.tab-pane');

const tabActive = $('.tab-item.active');
const line = $('.tabs .line');

line.style.left = tabActive.offsetLeft + 'px';
line.style.width = tabActive.offsetWidth + 'px';

tabs.forEach(
  (tab, index) =>
    (tab.onclick = function () {
      const pane = panes[index]; //lấy ra nội dung pane ứng với mỗi tab

      $('.tab-item.active').classList.remove('active'); //xóa class active khỏi tab đang active
      $('.tab-pane.active').classList.remove('active'); //xóa class active khỏi pane đang active

      line.style.left = this.offsetLeft + 'px';
      line.style.width = this.offsetWidth + 'px';

      this.classList.add('active'); //add class active vào el được click
      pane.classList.add('active'); //add class active vào el pane tương tứng với tab khi click
    })
);
