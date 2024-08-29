import Database from "../libs/database";

(async () => {
    const instance = Database.getInstance();
    const db = await instance.getDb();
    const userCollection = db.collection('users');
    const analystCollection = db.collection("analysts");

    const work = async () => {
        let last_active_1h_users = 0;
        let last_active_3h_users = 0;
        let last_active_6h_users = 0;
        let last_active_12h_users = 0;
        let total_ton_mortgage_amount = 0;
        let total_tgpet_borrowed_amount = 0;
        let total_tgpet_repayed_amount = 0;
        let new_users = 0;
        let total_borrowed_users = 0;
        let total_users = 0;
        const user_contries: { [key: string]: number } = {};

        const now = new Date();

        const current_timestamp = now.getTime();

        const current_date_string = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

        const daily_data_chart: { dates: string[], categories: string[], series: { name: string, data: number[] }[] } = {
            dates: [],
            categories: [],
            series: [
                {
                    name: "Total Users",
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                },
                {
                    name: "New Users",
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                }
            ]
        };

        const weekly_data_chart: { dates: string[], categories: string[], series: { name: string, data: number[] }[] } = {
            dates: [],
            categories: [],
            series: [
                {
                    name: "Total Users",
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                },
                {
                    name: "New Users",
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                }

            ]
        };

        for (let i = 0; i < 12; ++i) {
            const daily_date = new Date(now.getTime() - i * 24 * 60 * 60000);

            daily_data_chart.dates.push(`${daily_date.getFullYear()}-${daily_date.getMonth() + 1}-${daily_date.getDate()}`);

            daily_data_chart.categories.push(daily_date.toDateString().split(' ')[0]);

            const weekly_date = new Date(now.getTime() - i * 7 * 24 * 60 * 60000);

            weekly_data_chart.dates.push(`${weekly_date.getFullYear()}-${weekly_date.getMonth() + 1}-${weekly_date.getDate()}`);

            weekly_data_chart.categories.push(`${weekly_date.getFullYear()}-${weekly_date.getMonth() + 1}-${weekly_date.getDate()}`);
        };

        daily_data_chart.dates.reverse();

        daily_data_chart.categories.reverse();

        weekly_data_chart.dates.reverse();

        weekly_data_chart.categories.reverse();

        for await (const user of userCollection.find().stream()) {
            const last_active_at = user.last_active_at.getTime();
            const user_created_at = user.created_at.getTime();

            if (user.last_active_at && (current_timestamp - last_active_at) < 60 * 60000) ++last_active_1h_users;

            if (user.last_active_at && (current_timestamp - last_active_at) < 3 * 60 * 60000) ++last_active_3h_users;

            if (user.last_active_at && (current_timestamp - last_active_at) < 6 * 60 * 60000) ++last_active_6h_users;

            if (user.last_active_at && (current_timestamp - last_active_at) < 12 * 60 * 60000) ++last_active_12h_users;

            total_ton_mortgage_amount += user.totals?.ton_mortgage_amount ? user.totals.ton_mortgage_amount : 0;

            total_tgpet_borrowed_amount += user.totals?.tgpet_borrowed_amount ? user.totals.tgpet_borrowed_amount : 0;

            total_tgpet_repayed_amount += user.totals?.tgpet_repayed_amount ? user.totals.tgpet_repayed_amount : 0;

            const is_new = (
                user.created_at.getFullYear() === now.getFullYear() &&
                user.created_at.getMonth() === now.getMonth() &&
                user.created_at.getDate() === now.getDate()
            );

            if (is_new) ++new_users;

            if (user.totals?.ton_mortgage_amount && user.totals.ton_mortgage_amount > 0) ++total_borrowed_users;

            ++total_users;

            if (user.ip_location?.country_code) user_contries[user.ip_location.country_code] = (user_contries[user.ip_location.country_code] || 0) + 1;

            // Daily Total
            for (let daily_index = 0; daily_index < daily_data_chart.dates.length; ++daily_index) {
                if (
                    user_created_at < new Date(daily_data_chart.dates[daily_index]).getTime()
                ) {
                    ++daily_data_chart.series[0].data[daily_index];
                };
            };

            console.log(daily_data_chart.dates, daily_data_chart.series[0].data)

            // Daily New
            const user_current_date_string = `${user.created_at.getFullYear()}-${user.created_at.getMonth() + 1}-${user.created_at.getDate()}`;

            const user_current_index = daily_data_chart.dates.indexOf(user_current_date_string);

            if (user_current_index !== -1) ++daily_data_chart.series[1].data[user_current_index];

            // Weekly Total
            for (let weekly_index = 0; weekly_index < weekly_data_chart.dates.length; ++weekly_index) {
                if (
                    user_created_at < new Date(weekly_data_chart.dates[weekly_index]).getTime()) {
                    ++weekly_data_chart.series[0].data[weekly_index];
                };
            };

            // Weekly New
            for (let weekly_index = 0; weekly_index < weekly_data_chart.dates.length; ++weekly_index) {

                if (
                    user_created_at > new Date(weekly_data_chart.dates[weekly_index]).getTime() &&
                    (
                        !weekly_data_chart.dates[weekly_index + 1] ||
                        user_created_at < new Date(weekly_data_chart.dates[weekly_index + 1]).getTime()
                    )
                ) {
                    ++weekly_data_chart.series[1].data[weekly_index];
                };
            };
        };

        await analystCollection.updateOne(
            { analyst_type: 'analyst_users', analyst_time: current_date_string },
            {
                $set: {
                    last_active_1h_users,
                    last_active_3h_users,
                    last_active_6h_users,
                    last_active_12h_users,
                    total_ton_mortgage_amount,
                    total_tgpet_borrowed_amount,
                    total_tgpet_repayed_amount,
                    new_users,
                    total_borrowed_users,
                    total_users,
                    user_contries,
                    daily_data_chart,
                    weekly_data_chart,
                    updated_at: new Date()
                },
            },
            { upsert: true }
        );

        console.log(`[users]: ${total_users} users was analyzed.`);
    };

    await work();

    setInterval(work, 5 * 60000);
})();