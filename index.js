const express = require('express');
const cors = require('cors');
const os = require('os');
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



        app.get("/staffs", async (req, res) => {
            const staffs = await staffsCollection.find().toArray();
            res.send(staffs);
        })

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


        app.put('/set_ip/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedIP = req.body;

            console.log(updatedIP);

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

