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



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@bismillahenterpriseclus.eoxgyuj.mongodb.net/?retryWrites=true&w=majority&appName=BismillahEnterpriseCluster`;

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
        const wifiIpCollection = client.db('Bismillah_Enterprise').collection('wifi_ip');
        const userRequestCollection = client.db('Bismillah_Enterprise').collection('user_request');



        app.get("/staffs", async (req, res) => {
            const staffs = await staffsCollection.find().toArray();
            res.send(staffs);
        })
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
        })
        app.get('/staff_name/:name', async (req, res) => {
            const name = req.params.name;
            try {
                const result = await staffsCollection.findOne({ display_name: name });
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: "Failed to query staffs by name" });
            }
        });
        app.get('/get_network_ip', (req, res) => {
            const interfaces = os.networkInterfaces();
            let localIp = null;

            for (let name in interfaces) {
                for (let iface of interfaces[name]) {
                    if (iface.family === 'IPv4' && !iface.internal) {
                        localIp = iface.address;
                    }
                }
            }

            res.json({ ip: localIp || 'Not found' });
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
        app.get('/user_request_name/:name', async (req, res) => {
            const name = req.params.name;
            try {
                const result = await userRequestCollection.findOne({ name });
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: "Failed to query user_request by name" });
            }
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


        app.put('/set_ip/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedIP = req.body;
            const wifiIP = {
                $set: {
                    wifi_ip: updatedIP.wifi_ip
                }
            };

            try {
                const result = await wifiIpCollection.updateOne(filter, wifiIP, options);
                res.send(result);
            } catch (err) {
                res.status(500).send({ error: 'Update failed', details: err });
            }
        });
        app.put('/staffs_daily_time/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedTime = req.body;
            let attendance
            if (updatedTime.name == 'today_enter1_time') {
                attendance = {
                    $set: {
                        today_enter1_time: updatedTime.clickedTime
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

        app.get('/set_ip', async (req, res) => {
            const seted_wifi_ip = await wifiIpCollection.find().toArray();
            res.send(seted_wifi_ip);
        })




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

