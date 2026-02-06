#[derive(Debug)]
struct Profile {
    // TODO: add a bio field
}

#[derive(Debug)]
struct User {
    name: String,
    age: u8,
    // TODO: add an optional profile field
}

impl Profile {
    fn new(/* TODO */) -> Self {
        todo!()
    }
}

impl User {
    fn new(name: impl Into<String>, age: u8) -> Self {
        Self {
            name: name.into(),
            age,
            // TODO: initialize profile
        }
    }

    fn with_profile(mut self, profile: Profile) -> Self {
        // TODO: attach the profile
        self
    }

    fn summary(&self) -> String {
        let bio = match &self.profile {
            Some(profile) => profile.bio.as_str(),
            None => "no bio yet",
        };
        format!("{} ({}) - {}", self.name, self.age, bio)
    }
}

fn main() {
    let user = User::new("Taylor", 29)
        .with_profile(Profile::new(/* TODO */));

    println!("{}", user.summary());
}
