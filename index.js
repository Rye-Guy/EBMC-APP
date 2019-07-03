require('dotenv').config()
const Mailchimp = require('mailchimp-api-v3')
const axios = require('axios') 
const mailchimp = new Mailchimp(process.env.MC_API_KEY)
const md5 = require('js-md5');

axios.get(`https://www.eventbriteapi.com/v3/events/63913082751/attendees/?token=${process.env.EB_PRIVATE_API_KEY}`).then((res) => {
    event_attendees = res.data.attendees
    event_attendees.forEach((attendee) => {
        console.log(attendee.profile)
        mailchimp.post({
            path: 'lists/1b9f43edc3/members',
            body: {
                "email_address": attendee.profile.email,
                "status": "subscribed",
                "merge_fields": {
                    "FNAME": attendee.profile.first_name,
                    "LNAME": attendee.profile.last_name
                }
            }
        }).then((res)=>{
            console.log(res)
        }).catch((err)=>{
            console.log(err)
        })
    });
   
}).catch((err) => {
   console.log(err)
});



