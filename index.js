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

let attendee_batch = []
let attendees_checked_in = []


const chainAsync = fns => {
    let curr = 0;
    const last = fns[fns.length - 1];
    const next = () => {
      const fn = fns[curr++];
      fn === last ? fn() : fn(next);
    };
    next();
};

axios.get(`https://www.eventbriteapi.com/v3/events/${process.env.EB_EVENT_ID}/attendees/?token=${process.env.EB_PRIVATE_API_KEY}`).then((res) => {
    console.log(res.data.pagination.page_count)
        chainAsync([
        next => {
            for (i = 1; i <= res.data.pagination.page_count; i++) {
                axios.get(`https://www.eventbriteapi.com/v3/events/${process.env.EB_EVENT_ID}/attendees/?token=${process.env.EB_PRIVATE_API_KEY}&page=${i}`).then((res) => {
                    event_attendees = res.data.attendees    
                    event_attendees.forEach(attendee => {
                        attendee_obj = {
                            "method": "post",
                            "path": "/lists/864ae29f4d/members/",
                            "body": {
                                "email_address": attendee.profile.email,
                                "status": "subscribed",
                                "merge_fields": {
                                    "FNAME": attendee.profile.first_name,
                                    "LNAME": attendee.profile.last_name
                                }
                            }
                        }
                        attendee_batch.push(attendee_obj)
                    })

                    event_attendees.forEach(attendee =>{
                        console.log(attendee.checked_in === true)
                        if(attendee.checked_in === true){
                            attendee_checked_in_tag = {
                                "method": "post",
                                "path": `lists/864ae29f4d/members/${md5(attendee.profile.email)}/tags`,
                                "body": {
                                    "tags": [{
                                        "name": "do-these-1600-or-so-in-a-batch",
                                        "status": "active"
                                    }]
                                }
                             }
                             console.log(attendee_checked_in_tag)
                             attendees_checked_in.push(attendee_checked_in_tag)
                        }
                    })
                }).catch((err) => {
                    //console.log(err)
                })
            }
            setTimeout(next, 5000);
            console.log(attendee_batch)
        },
        next => {
            console.log('5 second');
            mailchimp.batch(attendee_batch, {
                        wait : true,
                        interval : 1000,
                        unpack : true,
                   }).then((res)=>{
                    //  console.log(res)
                   }).catch((err)=>{
                       //console.log(err[1].title)
                    
                   })
            setTimeout(next, 10000);
        },
        next =>{
            console.log(attendees_checked_in)
            mailchimp.batch(attendees_checked_in,{
                wait: true,
                interval: 1000,
                unpack: true
            }).then((res)=>{
                console.log(res)
            }).catch((err)=>{
                console.log(err)
            })
        }
        ]);
    
}).catch((err) => {
    console.log(err)
});

