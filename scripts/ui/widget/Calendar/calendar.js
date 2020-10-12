class Calendar {
    constructor(kernel, setting) {
        this.kernel = kernel
        this.setting = setting
        this.sloarToLunar = this.kernel.registerPlugin("sloarToLunar")
        this.colorTone = this.setting.get("calendar.colorTone")
        this.hasHoliday = this.setting.get("calendar.holiday")
        this.holidayColor = this.setting.get("calendar.holidayColor")
        this.holidayNoRestColor = this.setting.get("calendar.holidayNoRestColor")// 调休
        if (this.hasHoliday && $file.exists(this.setting.holidayPath)) {// 假期信息
            this.holiday = JSON.parse($file.read(this.setting.holidayPath).string).holiday
        }
        this.monthDisplayMode = this.setting.get("calendar.monthDisplayMode")// 月份显示模式
        this.widget2x2TitleYear = this.setting.get("calendar.small.title.year")// 2x2标题是否显示年
        this.firstDayOfWeek = this.setting.get("calendar.firstDayOfWeek")// 每周第一天
        this.lunar2x2 = this.setting.get("calendar.small.lunar")// 2x2是否显示农历
        this.family = {
            small: 0,
            large: 2
        }
    }

    setDisplaySize(displaySize) {
        this.displaySize = displaySize.height
    }

    localizedWeek(index) {
        let week = []
        week[0] = $l10n("SUNDAY")
        week[1] = $l10n("MONDAY")
        week[2] = $l10n("TUESDAY")
        week[3] = $l10n("WEDNESDAY")
        week[4] = $l10n("THURSDAY")
        week[5] = $l10n("FRIDAY")
        week[6] = $l10n("SATURDAY")
        if (this.firstDayOfWeek === 1) {
            index += 1
            if (index > 6) index = 0
        }
        return week[index]
    }

    localizedMonth(index) {
        let mode = this.monthDisplayMode === 0 ? "_C" : "_N"
        let month = []
        month[0] = $l10n("JANUARY" + mode)
        month[1] = $l10n("FEBRUARY" + mode)
        month[2] = $l10n("MARCH" + mode)
        month[3] = $l10n("APRIL" + mode)
        month[4] = $l10n("MAY" + mode)
        month[5] = $l10n("JUNE" + mode)
        month[6] = $l10n("JULY" + mode)
        month[7] = $l10n("AUGUST" + mode)
        month[8] = $l10n("SEPTEMBER" + mode)
        month[9] = $l10n("OCTOBER" + mode)
        month[10] = $l10n("NOVEMBER" + mode)
        month[11] = $l10n("DECEMBER" + mode)
        return month[index] + $l10n("MONTH")
    }

    isHoliday(year, month, date) {
        /**
         * 数字补0
         */
        const toString = number => {
            if (number < 10) {
                number = "0" + number
            }
            return String(number)
        }
        if (!this.holiday) {
            return false
        }
        let key = toString(month) + "-" + toString(date)
        let holiday = this.holiday[key]
        if (holiday && holiday.date === year + "-" + key) {
            return holiday
        }
        return false
    }

    getCalendar(lunar) {
        let date = new Date()
        let year = date.getFullYear()
        let month = date.getMonth()
        let dateNow = date.getDate()// 当前日期
        let dates = new Date(year, month + 1, 0).getDate()// 总天数
        let firstDay = new Date(year, month, 1).getDay()// 本月第一天是周几
        if (this.firstDayOfWeek === 1) {// 设置中设定每周第一天是周几
            firstDay -= 1
            if (firstDay < 0) firstDay = 6
        }
        let calendar = []
        for (let date = 1; date <= dates;) {
            let week = []
            for (let day = 0; day <= 6; day++) {
                if (day === firstDay) firstDay = 0
                // 只有当firstDay为this.firstDay时才开始放入数据，之前的用0补位
                let formatDay = this.firstDayOfWeek === 1 ? day + 1 : day// 判断每周第一天
                if (formatDay > 6) formatDay = 0
                let formatDate = firstDay === 0 ? (date > dates ? 0 : {
                    date: date,
                    day: formatDay
                }) : 0
                // 农历
                if (date === dateNow) {
                    // 保存农历信息
                    this.lunar = this.sloarToLunar(year, month + 1, date)
                }
                if (lunar && formatDate !== 0) {
                    formatDate["lunar"] = date === dateNow ? this.lunar : this.sloarToLunar(year, month + 1, date)
                }
                // 节假日
                if (this.hasHoliday && formatDate !== 0) {// 判断是否需要展示节假日
                    // month是0-11，故+1
                    let holiday = this.isHoliday(year, month + 1, date)
                    if (holiday) {
                        formatDate["holiday"] = holiday
                    }
                }
                week.push(formatDate)
                if (firstDay === 0) date++
            }
            calendar.push(week)
        }
        return {
            year: year,
            month: month,
            calendar: calendar,
            date: dateNow,
        }
    }

    formatCalendar(family, calendarInfo) {
        const titleHeight = 20 + 15 // +10为标题padding
        const padding = 10 // 自身表格边距
        const minWidth = parseInt(this.displaySize / 7 - 10)
        const line = calendarInfo.calendar.length + 1 // 日历行数
        const height = parseInt((this.displaySize - titleHeight - padding) / line)
        const template = (text, props = {}, ext = undefined) => {
            let views = [{
                type: "text",
                props: Object.assign({
                    text: text,
                    font: $font(12),
                    minimumScaleFactor: 0.5
                }, props.text)
            }]
            if (ext) {
                views.push({
                    type: "text",
                    props: Object.assign({
                        text: ext,
                        font: $font(12),
                        minimumScaleFactor: 0.5
                    }, props.ext)
                })
            }
            return {
                type: "hstack",
                props: {
                    clipped: true,
                    cornerRadius: 5
                },
                views: [{
                    type: "vstack",
                    props: Object.assign({
                        alignment: $widget.verticalAlignment.center,
                        color: $color("primaryText"),
                        background: $color("clear"),
                        padding: $insets(0, 3, 0, 3),
                        frame: {
                            minWidth: minWidth,
                            height: height,
                            alignment: $widget.alignment.center
                        }
                    }, props.box),
                    views: views
                }]
            }
        }

        let calendar = calendarInfo.calendar
        let days = []
        for (let line of calendar) {
            for (let date of line) {
                if (date === 0) {// 空白直接跳过
                    days.push(template(""))
                    continue
                }
                // 初始样式
                let props = {
                    text: { color: $color("primaryText") },
                    ext: { color: $color("primaryText") },// 额外信息样式，如农历等
                    box: { background: $color("clear") }
                }
                if (date.day === 0 || date.day === 6) {
                    props.ext.color = props.text.color = $color("systemGray2")
                }
                // 节假日
                if (date.holiday) {
                    if (date.holiday.holiday) {
                        props.ext.color = props.text.color = $color(this.holidayColor)
                    } else {
                        props.ext.color = props.text.color = $color(this.holidayNoRestColor)
                    }
                }
                // 当天
                if (date.date === calendarInfo.date) {
                    props.text.color = $color("white")
                    props.ext.color = $color("white")
                    if (!date.holiday) {
                        props.box.background = $color(this.colorTone)
                    } else {
                        if (date.holiday.holiday)
                            props.box.background = $color(this.holidayColor)
                        else
                            props.box.background = $color(this.holidayNoRestColor)
                    }
                }
                // 4x4 widget 可显示额外信息
                let ext
                if (family === this.family.large) {
                    ext = date.holiday ? date.holiday.name : date.lunar.lunarDay
                }
                days.push(template(String(date.date), props, ext))
            }
        }
        // 加入星期指示器
        let title = []
        for (let i = 0; i < 7; i++) {
            title.push(template(this.localizedWeek(i), {
                text: { color: $color(this.colorTone) },
                box: {
                    frame: {
                        minWidth: minWidth,
                        height: family === this.family.large ? height / 2 : height,// 4x4 widget 日期指示器高度减半
                        alignment: $widget.alignment.center
                    }
                }
            }))
        }
        return title.concat(days)
    }

    calendarView(family) {
        let calendarInfo = this.getCalendar(family === this.family.large)
        let calendar = {
            type: "vgrid",
            props: {
                columns: Array(7).fill({
                    flexible: {
                        minimum: 10,
                        maximum: Infinity
                    },
                    spacing: 0,
                    padding: 0,
                }),
                padding: $insets(0, 10, 10, 10),
            },
            views: this.formatCalendar(family, calendarInfo)
        }
        // 标题栏文字内容
        let content
        if (family === this.family.large) {
            content = {
                left: calendarInfo.year + $l10n("YEAR") + this.localizedMonth(calendarInfo.month),
                right: this.lunar.lunarYear + $l10n("YEAR") + this.lunar.lunarMonth + $l10n("MONTH") + this.lunar.lunarDay,
                size: 18
            }
        } else {
            let year = this.widget2x2TitleYear ? String(calendarInfo.year).slice(-2) + $l10n("YEAR") : ""
            let right = this.lunar2x2 ? this.lunar.lunarMonth + $l10n("MONTH") + this.lunar.lunarDay : ""
            content = {
                left: year + this.localizedMonth(calendarInfo.month),
                right: right
            }
        }
        let width = this.displaySize / 2
        let titleBar = {
            type: "hstack",
            props: {
                padding: $insets(10, 13, 5, 13),
                frame: {
                    width: Infinity,
                    height: 20
                }
            },
            views: [
                {
                    type: "text",
                    props: {
                        text: content.left,
                        color: $color(this.colorTone),
                        font: $font("bold", content.size),
                        frame: {
                            alignment: $widget.alignment.leading,
                            maxWidth: width,
                            height: 20
                        }
                    }
                },
                {
                    type: "text",
                    props: {
                        text: content.right,
                        color: $color(this.colorTone),
                        font: $font("bold", content.size),
                        frame: {
                            alignment: $widget.alignment.trailing,
                            maxWidth: width,
                            height: 20
                        }
                    }
                }
            ]
        }
        return {
            type: "vstack",
            props: {
                link: "jsbox://run?name=EasyWidget",
                alignment: $widget.verticalAlignment.center,
                spacing: 0
            },
            views: [titleBar, calendar]
        }
    }
}

module.exports = Calendar