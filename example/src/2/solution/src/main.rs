#[derive(Debug)]
struct Profile {
    bio: String,
}

#[derive(Debug)]
struct User {
    name: String,
    age: u8,
    profile: Option<Profile>,
}

impl Profile {
    fn new(bio: impl Into<String>) -> Self {
        Self { bio: bio.into() }
    }
}

impl User {
    fn new(name: impl Into<String>, age: u8) -> Self {
        Self {
            name: name.into(),
            age,
            profile: None,
        }
    }

    fn with_profile(mut self, profile: Profile) -> Self {
        self.profile = Some(profile);
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
        .with_profile(Profile::new("Rustacean and workshop fan"));

    println!("{}", user.summary());
}
