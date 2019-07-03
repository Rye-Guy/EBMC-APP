require('dotenv').config()
const Mailchimp = require('mailchimp-api-v3')
const axios = require('axios')
const mailchimp = new Mailchimp(process.env.MC_API_KEY)
const md5 = require('js-md5');

// { pagination:
//     { object_count: 1685,
//       page_number: 1,
//       page_size: 50,
//       page_count: 34,
//       continuation: 'eyJwYWdlIjogMn0',
//       has_more_items: true },

const postAttendeeToMC = async (attendee, checked_in) => {
    if(!attendee){
        console.log(attendee, checked_in)
        return
    }
    await mailchimp.post({
        path: 'lists/1b9f43edc3/members',
        body: {
            "email_address": attendee.profile.email,
            "status": "subscribed",
            "merge_fields": {
                "FNAME": attendee.profile.first_name,
                "LNAME": attendee.profile.last_name
            }
        }
    }).then((res) => {
       console.log(res)

    }).catch(async (err) => {
        console.log(err.title)
        if (err.title === 'Member Exists') {
            if (checked_in === true) {
            //    console.log('happening')
            await mailchimp.post({
                    path: `lists/1b9f43edc3/members/${md5(attendee.profile.email)}/tags`,
                    body: {
                        "tags": [{
                            "name": "Checked-In-Test",
                            "status": "active"
                        }]
                    }
                }).then((res) => {
                     console.log(res)
                }).catch((err) => {
                    console.log(err)
                })
            }
        }
    })
}

axios.get(`https://www.eventbriteapi.com/v3/events/${process.env.EB_EVENT_ID}/attendees/?token=${process.env.EB_PRIVATE_API_KEY}`).then((res) => {
    for(i = 1; i <= parseInt(res.data.pagination.page_count); i++){
         axios.get(`https://www.eventbriteapi.com/v3/events/${process.env.EB_EVENT_ID}/attendees/?token=${process.env.EB_PRIVATE_API_KEY}&page=${i}`).then((res) => {
            event_attendees = res.data.attendees
            event_attendees.forEach(attendee => {   
               postAttendeeToMC(attendee, attendee.checked_in)
            });
        }).catch((err) => {
            console.log(err)
        })
    }
}).catch((err) => {
  console.log(err)
});