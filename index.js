const express = require('express');
const cors = require('cors');
const os = require('os');
const cron = require('node-cron');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@bookshelfcluster.p3s31ub.mongodb.net/?retryWrites=true&w=majority&appName=bookshelfCluster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection

        const staffsCollection = client.db('Bismillah_Enterprise').collection('staffs');
        const shopLocationCollection = client.db('Bismillah_Enterprise').collection('shop_location');
        const userRequestCollection = client.db('Bismillah_Enterprise').collection('user_request');
        const shopCodeCollection = client.db('Bismillah_Enterprise').collection('shop_code');
        const additionalMovementRequestCollection = client.db('Bismillah_Enterprise').collection('additional_movement_request');

        app.get("/shop_code/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const shopCode = await shopCodeCollection.find(query).toArray();
            res.send(shopCode);
        })
        app.put('/shop_code/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedCode = req.body;
            const shopCode = {
                $set: {
                    shop_code: updatedCode.shop_code
                }
            };

            try {
                const result = await shopCodeCollection.updateOne(filter, shopCode, options);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });
        app.put('/additional_request_approve/:uid', async (req, res) => {
            const uid = req.params.uid;
            const filter = { uid: uid };
            const options = { upsert: true };
            const updatedStatus = req.body;
            const movementStatus = {
                $set: {
                    additional_movement_status: updatedStatus.additional_movement_status
                }
            };

            try {
                const result = await staffsCollection.updateOne(filter, movementStatus, options);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });
        app.get("/staffs", async (req, res) => {
            const staffs = await staffsCollection.find().toArray();
            res.send(staffs);
        });
        app.get("/staff/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const staff = await staffsCollection.find(query).toArray();
            if (staff) {
                res.send(staff);
            }
            else {
                res.send({ message: 'You Are Waiting For Admin Approval' })
            }
        });
        app.get('/staff/uid_query/:uid', async (req, res) => {
            const uid = req.params.uid;
            try {
                const result = await staffsCollection.findOne({ uid: uid });
                if (result) {
                    res.send(result);
                }
                else {
                    res.send({ message: "UID not found" })
                }
            } catch (err) {
                res.status(500).send({ error: "Failed to query staffs by name" });
            }
        });

        app.post('/staff', async (req, res) => {
            const newStaff = req.body;
            try {
                const result = await staffsCollection.insertOne(newStaff);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: "Failed to insert user request" });
            }
        })
        app.delete('/staff/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await staffsCollection.deleteOne(filter);
            res.send(result);
        })

        // app.get('/get_network_ip', (req, res) => {
        //     const interfaces = os.networkInterfaces();
        //     let localIp = null;

        //     for (let name in interfaces) {
        //         for (let iface of interfaces[name]) {
        //             if (iface.family === 'IPv4' && !iface.internal) {
        //                 localIp = iface.address;
        //             }
        //         }
        //     }

        //     res.json({ ip: localIp || 'Not found' });
        // });
        app.get('/user_request_uid/:uid', async (req, res) => {
            const uid = req.params.uid;

            try {
                const userRequest = await userRequestCollection.findOne({ uid });
                if (userRequest) {
                    res.send(userRequest);
                } else {
                    // ✅ Send null or empty object, NOT nothing
                    res.send({ message: 'UID not found' })
                }
            } catch (err) {
                res.status(500).send({ error: 'Server error checking user request' });
            }
        });
        app.post('/user_request', async (req, res) => {
            const user = req.body;
            try {
                const result = await userRequestCollection.insertOne(user);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: "Failed to insert user request" });
            }
        });
        app.get('/additional_movement_request', async (req, res) => {
            const result = await additionalMovementRequestCollection.find().toArray();
            res.send(result);
        })
        app.post('/additional_movement_request', async (req, res) => {
            const movementData = req.body;
            try {
                const result = await additionalMovementRequestCollection.insertOne(movementData);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: "Failed to insert request" });
            }
        });
        app.delete('/additional_movement_request/:uid', async (req, res) => {
            const uid = req.params.uid;
            const filter = { uid: uid };
            const result = await additionalMovementRequestCollection.deleteOne(filter);
            res.send(result);
        });


        app.get('/user_request', async (req, res) => {
            const user = await userRequestCollection.find().toArray();
            res.send(user);
        })
        app.delete('/user_request/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await userRequestCollection.deleteOne(filter);
            res.send(result);
        })
        app.post('/new_staff', async (req, res) => {
            const new_staff = req.body;
            const result = staffsCollection.insertOne(new_staff);
            res.send(result);
        })


        // app.put('/set_ip/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: new ObjectId(id) };
        //     const options = { upsert: true };
        //     const updatedIP = req.body;
        //     const wifiIP = {
        //         $set: {
        //             wifi_ip: updatedIP.wifi_ip
        //         }
        //     };

        //     try {
        //         const result = await wifiIpCollection.updateOne(filter, wifiIP, options);
        //         res.send(result);
        //     } catch (err) {
        //         res.status(500).send({ error: 'Update failed', details: err });
        //     }
        // });
        app.put('/staffs_daily_time/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedTime = req.body;
            let attendance
            if (updatedTime.name == 'today_enter1_time') {
                attendance = {
                    $set: {
                        today_enter1_time: updatedTime.clickedTime,
                        today_date: updatedTime.today_date
                    }
                };
            }
            else if (updatedTime.name == 'today_exit1_time') {
                attendance = {
                    $set: {
                        today_exit1_time: updatedTime.clickedTime
                    }
                };
            }
            else if (updatedTime.name == 'today_enter2_time') {
                attendance = {
                    $set: {
                        today_enter2_time: updatedTime.clickedTime
                    }
                };
            }
            else if (updatedTime.name == 'today_exit2_time') {
                attendance = {
                    $set: {
                        today_exit2_time: updatedTime.clickedTime
                    }
                };
            }

            try {
                const result = await staffsCollection.updateOne(filter, attendance, options);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });
        app.put('/additional_movements/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedTime = req.body;
            let attendance
            if (updatedTime.name == 'additional_enter_time') {
                attendance = {
                    $set: {
                        additional_enter_time: updatedTime.clickedTime
                    }
                };
            }
            else if (updatedTime.name == 'additional_exit_time') {
                attendance = {
                    $set: {
                        additional_exit_time: updatedTime.clickedTime
                    }
                };
            }

            try {
                const result = await staffsCollection.updateOne(filter, attendance, options);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });

        // app.put('/reset_time/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const updatedTime = req.body
        //     const filter = { _id: new ObjectId(id) };
        //     const updateDoc = {
        //         $set: {
        //             today_enter1_time: updatedTime.enter1_time,
        //             today_exit1_time: updatedTime.exit1_time,
        //             today_enter2_time: updatedTime.enter2_time,
        //             today_exit2_time: updatedTime.exit2_time
        //         }
        //     };

        //     try {
        //         const result = await staffsCollection.updateOne(filter, updateDoc);
        //         res.status(200).send(result);
        //     } catch (err) {
        //         console.error('Update error:', err);
        //         res.status(500).send({ error: 'Update failed', details: err });
        //     }
        // });

        // code with calculate and set daily data
        app.put('/reset_time/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };

            try {
                // Get current staff data
                const staff = await staffsCollection.findOne(filter);
                const { today_enter1_time, today_exit1_time, today_enter2_time, today_exit2_time, hour_rate } = staff;

                // Helper: Convert 12-hour time string to minutes
                const toMinutes = (timeStr) => {
                    if (!timeStr) return 0;
                    const [time, modifier] = timeStr.split(' ');
                    let [hours, minutes] = time.split(':').map(Number);
                    if (modifier === 'PM' && hours !== 12) hours += 12;
                    if (modifier === 'AM' && hours === 12) hours = 0;
                    return hours * 60 + minutes;
                };

                // Calculate total working minutes
                const enter1 = toMinutes(today_enter1_time);
                const exit1 = toMinutes(today_exit1_time);
                const enter2 = toMinutes(today_enter2_time);
                const exit2 = toMinutes(today_exit2_time);
                const totalMinutes = (exit1 - enter1) + (exit2 - enter2);
                const totalHours = parseFloat((totalMinutes / 60).toFixed(2));
                const totalEarn = parseFloat((totalHours * parseFloat(hour_rate)).toFixed(2));

                // Prepare attendance object
                const now = new Date();
                const day = now.toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' });
                const dayName = now.toLocaleDateString('en-BD', { weekday: 'long' });

                const todaySummary = {
                    date: day,
                    day_name: dayName,
                    enter1: today_enter1_time,
                    exit1: today_exit1_time,
                    enter2: today_enter2_time,
                    exit2: today_exit2_time,
                    total_hour: totalHours,
                    total_earn: totalEarn
                };

                // Update database: Push daily data & reset today's values
                const updateDoc = {
                    $push: { current_month_details: todaySummary },
                    $set: {
                        today_enter1_time: '',
                        today_exit1_time: '',
                        today_enter2_time: '',
                        today_exit2_time: ''
                    }
                };

                const result = await staffsCollection.updateOne(filter, updateDoc);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err.message });
            }
        });

        cron.schedule('0 0 * * *', async () => {
            const allStaffs = await staffsCollection.find().toArray();
            for (const staff of allStaffs) {
                const id = staff._id.toString();
                // Reuse the existing reset logic as a function
                await fetch(`http://localhost:5000/reset_time/${id}`, { method: 'PUT' });
            }
            console.log('✅ All staff times reset and saved at 12:00 AM');
        });
        // ------------------------------------------------------------------------------------------

        cron.schedule('0 0 * * *', async () => {
            console.log('⏰ Resetting time fields at 12:00 AM');

            try {
                const result = await staffsCollection.updateMany(
                    {},
                    {
                        $set: {
                            today_enter1_time: '',
                            today_exit1_time: '',
                            today_enter2_time: '',
                            today_exit2_time: ''
                        }
                    }
                );

                console.log(`✅ Reset ${result.modifiedCount} records`);
            } catch (error) {
                console.error('❌ Failed to reset times:', error);
            }
        });

        // ✅ GET shop location
        app.get('/shop_location', async (req, res) => {
            try {
                const location = await shopLocationCollection.findOne({});
                if (!location) {
                    return res.status(404).json({ message: 'Shop location not found' });
                }
                res.json({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    shop_range: location.shop_range,
                });
            } catch (error) {
                console.error('GET /shop_location error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // ✅ POST update/insert shop location
        app.post('/shop_location', async (req, res) => {
            const { latitude, longitude, shop_range } = req.body;

            if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof shop_range !== 'number') {
                return res.status(400).json({ error: 'Latitude and Longitude must be numbers' });
            }

            try {
                const existing = await shopLocationCollection.findOne({});
                if (existing) {
                    await shopLocationCollection.updateOne(
                        { _id: existing._id },
                        { $set: { latitude, longitude, shop_range } }
                    );
                } else {
                    await shopLocationCollection.insertOne({ latitude, longitude, shop_range });
                }
                res.json({ message: 'Shop location saved successfully' });
            } catch (error) {
                console.error('POST /shop_location error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        app.put('/submit_work_time/:id', async (req, res) => {
            const id = req.params.id;
            const bodyData = req.body;
            const todaySummary = {
                current_date: bodyData.currentDate,
                current_day_name: bodyData.currentDayName,
                today_enter1_time: bodyData.today_enter1_time,
                today_exit1_time: bodyData.today_exit1_time,
                today_enter2_time: bodyData.today_enter2_time,
                today_exit2_time: bodyData.today_exit2_time,
                total_hour: bodyData.total_hour,
                total_minute: bodyData.total_minute,
                total_earn: bodyData.total_earn,
                additional_movement_hour: bodyData.additional_movement_hour,
                additional_movement_minute: bodyData.additional_movement_minute

            }
            const filter = { _id: new ObjectId(id) };

            try {
                // Update database: Push daily data & reset today's values
                const updateDoc = {
                    $push: { current_month_details: todaySummary },
                    $set: {
                        total_working_hour: bodyData.total_working_hour,
                        total_working_minute: bodyData.total_working_minute,
                        total_income: bodyData.total_income,
                        today_enter1_time: '',
                        today_exit1_time: '',
                        today_enter2_time: '',
                        today_exit2_time: '',
                        additional_enter_time: '',
                        additional_exit_time: '',
                        additional_movement_hour: 0,
                        additional_movement_minute: 0
                    }
                };
                const ErrorDoc = {
                    $set: {
                        today_enter1_time: '',
                        today_exit1_time: '',
                        today_enter2_time: '',
                        today_exit2_time: '',
                        additional_enter_time: '',
                        additional_exit_time: '',
                        additional_movement_hour: 0,
                        additional_movement_minute: 0
                    }
                }
                if (bodyData.today_exit1_time === '' || bodyData.today_exit2_time === '') {
                    const result = await staffsCollection.updateOne(filter, ErrorDoc);
                    res.send(result);
                }
                else {
                    const result = await staffsCollection.updateOne(filter, updateDoc);
                    res.send(result);
                }
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err.message });
            }
        });
        app.put('/additional_movement_submit/:id', async (req, res) => {
            const id = req.params.id;
            const bodyData = req.body;
            const filter = { _id: new ObjectId(id) };

            try {
                // Update database: Push daily data & reset today's values
                const updateDoc = {
                    $set: {
                        additional_enter_time: '',
                        additional_exit_time: '',
                        additional_movement_hour: bodyData.additional_movement_hour,
                        additional_movement_minute: bodyData.additional_movement_minute
                    }
                };
                const ErrorDoc = {
                    $set: {
                        additional_enter_time: '',
                        additional_exit_time: '',
                        additional_movement_hour: 0,
                        additional_movement_minute: 0
                    }
                }
                if (bodyData.additional_enter_time === '') {
                    const result = await staffsCollection.updateOne(filter, ErrorDoc);
                    res.send(result);
                }
                else {
                    const result = await staffsCollection.updateOne(filter, updateDoc);
                    res.send(result);
                }
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err.message });
            }
        });


        app.put('/transection_details/:id', async (req, res) => {
            const id = req.params.id;
            const bodyData = req.body;
            const filter = { _id: new ObjectId(id) };

            const newTransectionsData = {
                transection_id: bodyData.transection_id,
                transection_date: bodyData.currentDate,
                transection_amount: bodyData.transection_amount,
                transection_type: bodyData.transection_type,
                comment: bodyData.comment
            };

            try {
                const staff = await staffsCollection.findOne(filter);

                // Step 1: If length > 19, remove first transection
                if (staff?.transections?.length > 19) {
                    await staffsCollection.updateOne(filter, { $pop: { transections: -1 } }); // remove first
                }

                // Step 2: Push new transection + update balances
                const updateDoc = {
                    $push: {
                        transections: newTransectionsData
                    },
                    $set: {
                        withdrawal_amount: bodyData.withdrawal_amount,
                        available_balance: bodyData.available_balance
                    }
                };

                const result = await staffsCollection.updateOne(filter, updateDoc);
                res.send(result);

            } catch (err) {
                console.error(err);
                res.status(500).send({ error: 'Update failed', details: err.message });
            }
        });
        app.put('/closing_month/:id', async (req, res) => {
            const id = req.params.id;
            const bodyData = req.body;
            const filter = { _id: new ObjectId(id) };

            const newIncomeHistory = {
                month_name: bodyData.month_name,
                total_income: bodyData.total_income,
                total_worked_time: `${bodyData.total_working_hour} Hour, ${bodyData.total_working_minute} Minute`,
                paid_amount: bodyData.paid_amount,
                paid_date: bodyData.paid_date,
            };

            try {
                const staff = await staffsCollection.findOne(filter);

                // Step 1: If length > 19, remove first transection
                if (staff?.income_history?.length > 12) {
                    await staffsCollection.updateOne(filter, { $pop: { income_history: -1 } }); // remove first
                }

                // Step 2: Push new transection + update balances
                const updateDoc = {
                    $push: {
                        income_history: newIncomeHistory
                    },
                    $set: {
                        total_income: 0,
                        total_working_hour: 0,
                        total_working_minute: 0,
                        withdrawal_amount: 0,
                        available_balance: bodyData.last_month_due,
                        last_month_due: bodyData.last_month_due,
                        current_month_details: []
                    }
                };

                const result = await staffsCollection.updateOne(filter, updateDoc);
                res.send(result);

            } catch (err) {
                console.error(err);
                res.status(500).send({ error: 'Update failed', details: err.message });
            }
        });




        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Bismillah Enterprise is Running')
})

app.listen(port, () => {
    console.log(`bismillah enterprise is running on port: ${port}`)
})

