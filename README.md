
# [Work Wizards](https://work-wizards-1014.web.app/)

Explore our innovative online marketplace, where web development, digital marketing, and graphics design converge. Our user-friendly platform offers comprehensive job listings, dynamic bidding, and convenient registration. For job seekers, our 'My Bids' page ensures efficient bid management. Job owners benefit from the 'Bid Requests' page, enabling them to review, accept, and reject bids. Our unique '404' page ensures easy navigation. With a focus on user experience and functionality, this marketplace is a seamless gateway to opportunities and expertise in the digital world.

#### [Live Link](https://work-wizards-1014.web.app/)




## Features

- Dynamic Bidding System
- JWT Token Implementation for Enhanced Security
- Deadline Management for Jobs and Bids
- Private Routes for Sensitive Pages
- Quirky '404' Page with Easy Navigation
- Convenient Registration and Login


## API Reference

#### Get all items

```http
  GET /api/v1/job-posts
```

#### Get item

```http
  GET /api/v1/single-job-data?id=${_id}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | **Required**. Id of item to fetch |

