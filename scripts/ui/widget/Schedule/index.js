const ScheduleSetting = require("./setting")
const Schedule = require("./schedule")

class CalendarWidget {
    constructor(kernel) {
        this.kernel = kernel
        this.setting = new ScheduleSetting(this.kernel)
        this.schedule = new Schedule(this.kernel, this.setting)
        this.switchInterval = 1000 * 60 * 10 // 10分钟
    }

    custom() {
        this.setting.push()
    }

    async joinView() {
        return await this.schedule.scheduleView(this.setting.family.medium)
    }

    async view2x2() {
        return await this.schedule.scheduleView(this.setting.family.small)
    }

    async render() {
        let nowDate = new Date()
        const expireDate = new Date(nowDate + this.switchInterval)
        // 获取视图
        let view2x2 = await this.view2x2()
        $widget.setTimeline({
            entries: [
                {
                    date: nowDate,
                    info: {}
                }
            ],
            policy: {
                afterDate: expireDate
            },
            render: ctx => {
                // 只提供一种视图
                return view2x2
            }
        })
    }
}

module.exports = {
    Widget: CalendarWidget
}